from fastapi import APIRouter
from pydantic import BaseModel
import pandas as pd
import numpy as np
from keras.models import load_model
import joblib
from pymongo import MongoClient
from datetime import datetime, timedelta

router = APIRouter()


model = load_model("models/final_model_local.h5")
scaler = joblib.load("models/scaler.pkl")


client = MongoClient("mongodb://localhost:27017/")
db = client["watergo"]
collection = db["predictions"]


class PredictionInput(BaseModel):
    target_date: str  # YYYY-MM-DD
@router.post("/predict")
def predict_next_day(data: PredictionInput):
    try:
        from datetime import timezone

        # Parse target date
        target_date = datetime.strptime(data.target_date, "%Y-%m-%d").date()
        start_date = target_date - timedelta(days=21)

        print(f"🔎 Fetching 21-day window from {start_date} to {target_date - timedelta(days=1)}")

        # Fetch 21 previous days of data
        cursor = collection.find({
            "date": {
                "$gte": datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc),
                "$lt": datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
            }
        }).sort("date", 1)

        records = list(cursor)

        if len(records) < 21:
            return {"error": f"Not enough data (only {len(records)}) to predict for {target_date}."}

        # Create DataFrame
        df = pd.DataFrame(records)
        df["date"] = pd.to_datetime(df["date"])
        df.set_index("date", inplace=True)

        # ✅ Fallback: use predictedGroundwaterLevel if groundwaterLevel is missing
        if 'groundwaterLevel' in df.columns and 'predictedGroundwaterLevel' in df.columns:
            df['groundwaterLevel'] = df.apply(
                lambda row: row['groundwaterLevel']
                if pd.notnull(row['groundwaterLevel'])
                else row['predictedGroundwaterLevel'],
                axis=1
            )
        elif 'groundwaterLevel' not in df.columns and 'predictedGroundwaterLevel' in df.columns:
            df['groundwaterLevel'] = df['predictedGroundwaterLevel']
        elif 'groundwaterLevel' not in df.columns:
            return {"error": "Missing both 'groundwaterLevel' and 'predictedGroundwaterLevel' in the data."}

        # ✅ Required 24 features
        required_features = [
            "groundwaterLevel", "temperature", "dailyRainfall",
            "rain_lag_1", "temp_lag_1", "gw_lag_1",
            "rain_lag_3", "temp_lag_3", "gw_lag_3",
            "rain_lag_7", "temp_lag_7", "gw_lag_7",
            "rain_rolling_7", "temp_rolling_7",
            "rain_rolling_14", "temp_rolling_14",
            "month", "dayofyear", "sin_month", "cos_month",
            "sin_day", "cos_day",
            "gw_rolling_7", "gw_rolling_14"
        ]

        # Ensure features are present
        missing_cols = [col for col in required_features if col not in df.columns]
        if missing_cols:
            return {"error": f"Missing required feature columns: {', '.join(missing_cols)}"}

        # Ensure no null values
        if df[required_features].isnull().any().any():
            return {"error": "Some required feature values are missing (NaN)."}

        # Ensure exactly 21 rows
        if df.shape[0] != 21:
            return {"error": f"Expected 21 days of data, but got {df.shape[0]}."}

        # Prepare data for prediction
        features = df[required_features]
        scaled = scaler.transform(features)
        input_array = scaled.reshape(1, 21, scaled.shape[1])

        # Predict groundwater level
        prediction = float(model.predict(input_array)[0][0])

        # Prepare UTC timestamp for MongoDB insertion
        target_datetime = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)

        # Insert or update the predicted value in the database
        result = collection.update_one(
            {"date": target_datetime},
            {
                "$set": {
                    "predictedGroundwaterLevel": prediction,
                    "source": "model"
                },
                "$setOnInsert": {
                    "date": target_datetime
                }
            },
            upsert=True
        )

        # Set a meaningful status message
        if result.matched_count > 0:
            message = "Prediction updated for existing date."
        elif result.upserted_id is not None:
            message = "New prediction entry inserted."
        else:
            message = "No changes applied to database."

        return {
            "target_date": target_date.isoformat(),
            "predicted_groundwater_level": prediction,
            "status": message
        }

    except Exception as e:
        return {"error": str(e)}
@router.post("/test-predict")
def test_prediction_console(data: PredictionInput):
    try:
        target_date = datetime.strptime(data.target_date, "%Y-%m-%d")
        start_date = target_date - timedelta(days=21)

        print(f"🧠 Target Date: {target_date.date()}")
        print(f"🔁 Looking back from {start_date.date()} to {(target_date - timedelta(days=1)).date()}")

        # Fetch last 21 days using datetime directly
        cursor = collection.find({
            "date": {
                "$gte": start_date,
                "$lt": target_date
            }
        }).sort("date", 1)

        records = list(cursor)
        print(f"📦 Fetched {len(records)} records from MongoDB:")
        for rec in records:
            print(rec["date"])  # Debug: Print actual datetime values returned

        if len(records) < 21:
            return {"error": f"Not enough data (only {len(records)} rows) to predict for {target_date.date()}"}

        df = pd.DataFrame(records)
        df["date"] = pd.to_datetime(df["date"])  # Ensure correct format
        df.set_index("date", inplace=True)

        print(f"\n📅 Final Lookup Window:")
        print(df.tail(5))  # Show last few records

        features = df.drop(columns=["_id", "target_gw_next_day"], errors='ignore')
        scaled = scaler.transform(features)
        input_array = scaled.reshape(1, 21, scaled.shape[1])

        prediction = model.predict(input_array)
        print(f"📢 Predicted Groundwater Level for {target_date.date()}: {prediction[0][0]:.4f} meters")

        return {
            "target_date": target_date.date().isoformat(),
            "predicted_groundwater_level": float(prediction[0][0])
        }
    except Exception as e:
        return {"error": str(e)}
@router.post("/feature-engineer")
def generate_features_for_day(data: PredictionInput):
    try:
        from datetime import timezone

        target_date = datetime.strptime(data.target_date, "%Y-%m-%d").date()
        start_date = target_date - timedelta(days=14)

        # Step 1: Get previous 14 days data
        cursor = collection.find({
            "date": {
                "$gte": datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc),
                "$lt": datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
            }
        })
        records = list(cursor)
        if len(records) < 14:
            return {"error": f"Need 14 previous days to compute features. Found only {len(records)}."}

        df = pd.DataFrame(records)
        df["date"] = pd.to_datetime(df["date"])
        df.set_index("date", inplace=True)

        # Fallback for previous 14 days: predicted value if actual groundwater is missing
        if 'groundwaterLevel' in df.columns and 'predictedGroundwaterLevel' in df.columns:
            df['groundwaterLevel'] = df.apply(
                lambda row: row['groundwaterLevel']
                if pd.notnull(row['groundwaterLevel'])
                else row['predictedGroundwaterLevel'],
                axis=1
            )
        elif 'groundwaterLevel' not in df.columns and 'predictedGroundwaterLevel' in df.columns:
            df['groundwaterLevel'] = df['predictedGroundwaterLevel']
        elif 'groundwaterLevel' not in df.columns:
            return {"error": "Missing both 'groundwaterLevel' and 'predictedGroundwaterLevel' in previous days."}

        for col in ['groundwaterLevel', 'dailyRainfall', 'temperature']:
            if col not in df.columns:
                return {"error": f"Missing field in previous days: {col}"}

        # Step 2: Get and validate target day's base data
        target_datetime = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
        target_doc = collection.find_one({"date": target_datetime})

        if not target_doc:
            return {"error": f"Target date {target_date} not found in database. Please upload temperature, rainfall, and groundwaterLevel first."}

        for col in ["temperature", "dailyRainfall"]:
            if col not in target_doc or pd.isnull(target_doc[col]):
                return {"error": f"'{col}' is missing for {target_date}. Please input it before feature engineering."}

        # Fallback for groundwaterLevel if not present
        gw_level = None
        if 'groundwaterLevel' in target_doc and pd.notnull(target_doc['groundwaterLevel']):
            gw_level = target_doc['groundwaterLevel']
        elif 'predictedGroundwaterLevel' in target_doc and pd.notnull(target_doc['predictedGroundwaterLevel']):
            gw_level = target_doc['predictedGroundwaterLevel']
        else:
            return {"error": f"Both 'groundwaterLevel' and 'predictedGroundwaterLevel' are missing for {target_date}."}

        # Step 3: Perform feature engineering
        engineered = {
            "date": target_datetime,
            "temperature": target_doc["temperature"],
            "dailyRainfall": target_doc["dailyRainfall"]
        }

        # Lag Features
        for lag in [1, 3, 7]:
            engineered[f"rain_lag_{lag}"] = df["dailyRainfall"].iloc[-lag]
            engineered[f"temp_lag_{lag}"] = df["temperature"].iloc[-lag]
            engineered[f"gw_lag_{lag}"] = df["groundwaterLevel"].iloc[-lag]

        # Rolling Averages
        for roll in [7, 14]:
            engineered[f"rain_rolling_{roll}"] = df["dailyRainfall"].iloc[-roll:].mean()
            engineered[f"temp_rolling_{roll}"] = df["temperature"].iloc[-roll:].mean()
            engineered[f"gw_rolling_{roll}"] = df["groundwaterLevel"].iloc[-roll:].mean()

        # Date Features
        doy = target_date.timetuple().tm_yday
        month = target_date.month
        engineered["month"] = month
        engineered["dayofyear"] = doy
        engineered["sin_month"] = np.sin(2 * np.pi * month / 12)
        engineered["cos_month"] = np.cos(2 * np.pi * month / 12)
        engineered["sin_day"] = np.sin(2 * np.pi * doy / 365)
        engineered["cos_day"] = np.cos(2 * np.pi * doy / 365)

        # Step 4: Save back to MongoDB
        result = collection.update_one(
            {"date": target_datetime},
            {"$set": engineered},
            upsert=True
        )

        status_msg = "Feature engineered successfully."
        if result.upserted_id:
            status_msg += " New entry inserted."
        elif result.modified_count > 0:
            status_msg += " Existing entry updated."
        else:
            status_msg += " No change made."

        return {
            "target_date": target_date.isoformat(),
            "features": engineered,
            "status": status_msg
        }

    except Exception as e:
        return {"error": str(e)}
