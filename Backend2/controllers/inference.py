from fastapi import APIRouter
from pydantic import BaseModel
import pandas as pd
import numpy as np
from keras.models import load_model
import joblib
from pymongo import MongoClient
from datetime import datetime, timedelta

router = APIRouter()

# Load model and scaler
model = load_model("models/final_model.keras")
scaler = joblib.load("models/scaler.pkl")

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["watergo"]
collection = db["predictions"]

# Pydantic input model
class PredictionInput(BaseModel):
    target_date: str  # Format: YYYY-MM-DD

@router.post("/predict")
def predict_next_day(data: PredictionInput):
    try:
        target_date = datetime.strptime(data.target_date, "%Y-%m-%d").date()
        start_date = target_date - timedelta(days=21)

        # Fetch last 21 days
        cursor = collection.find({
            "date": {
                "$gte": start_date.isoformat(),
                "$lt": target_date.isoformat()
            }
        }).sort("date", 1)

        df = pd.DataFrame(list(cursor))
        if df.shape[0] < 21:
            return {"error": f"Insufficient data to predict for {target_date}"}

        df.set_index("date", inplace=True)
        features = df.drop(columns=["_id", "target_gw_next_day", "predicted_groundwater", "actual_groundwater"], errors='ignore')
        scaled = scaler.transform(features)
        reshaped = scaled.reshape(1, 21, scaled.shape[1])

        prediction = float(model.predict(reshaped)[0][0])

        # Save the prediction
        collection.update_one(
            {"date": target_date.isoformat()},
            {
                "$set": {
                    "predicted_groundwater": prediction,
                    "rainfall": None,
                    "temperature": None,
                    "actual_groundwater": None,
                    "source": "model"
                }
            },
            upsert=True
        )

        return {
            "target_date": target_date.isoformat(),
            "predicted_groundwater_level": prediction
        }

    except Exception as e:
        return {"error": str(e)}
