import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import joblib

from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

# Load dataset
df = pd.read_csv("cleaned_data.csv", parse_dates=["date"])
df.set_index("date", inplace=True)

# Target and features
target = df["target_gw_next_day"]
features = df.drop(columns=["target_gw_next_day"])

# Normalize
scaler = MinMaxScaler()
scaled_features = scaler.fit_transform(features)

joblib.dump(scaler, "scaler.pkl")  # Save for future use

# Train-validation-test split
X_temp, X_test, y_temp, y_test = train_test_split(scaled_features, target, test_size=0.15, shuffle=False)
X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.1765, shuffle=False)

def create_sequences(data, target, lookback=21):
    X, y = [], []
    for i in range(lookback, len(data)):
        X.append(data[i - lookback:i])
        y.append(target[i])
    return np.array(X), np.array(y)

lookback = 21
X_train_seq, y_train_seq = create_sequences(X_train, y_train, lookback)
X_val_seq, y_val_seq = create_sequences(X_val, y_val, lookback)
X_test_seq, y_test_seq = create_sequences(X_test, y_test, lookback)

print(f"Train: {X_train_seq.shape}")
print(f"Val: {X_val_seq.shape}")
print(f"Test: {X_test_seq.shape}")

# Build model
model = Sequential()
model.add(Conv1D(filters=128, kernel_size=3, activation='relu', input_shape=(lookback, X_train_seq.shape[2])))
model.add(MaxPooling1D(pool_size=2))
model.add(LSTM(units=128, return_sequences=False))
model.add(Dropout(0.3))
model.add(Dense(1))

model.compile(optimizer='adam', loss='mse', metrics=['mae'])
model.summary()

early_stop = EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True)

# Train
history = model.fit(
    X_train_seq, y_train_seq,
    validation_data=(X_val_seq, y_val_seq),
    epochs=100,
    batch_size=32,
    callbacks=[early_stop]
)

# Plot training history
plt.figure(figsize=(10, 6))
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.title("Loss Over Epochs")
plt.xlabel("Epochs")
plt.ylabel("MSE Loss")
plt.legend()
plt.grid(True)
plt.show()

# Evaluate
test_loss, test_mae = model.evaluate(X_test_seq, y_test_seq)
print(f"Test MSE: {test_loss:.4f}")
print(f"Test MAE: {test_mae:.4f}")

# Predictions
y_pred = model.predict(X_test_seq)

# Plot actual vs predicted
plt.figure(figsize=(12, 6))
plt.plot(y_test_seq, label="Actual")
plt.plot(y_pred, label="Predicted")
plt.title("Actual vs Predicted Groundwater Level")
plt.xlabel("Days")
plt.ylabel("Groundwater Level (scaled)")
plt.legend()
plt.grid(True)
plt.show()

# Metrics
rmse = np.sqrt(mean_squared_error(y_test_seq, y_pred))
r2 = r2_score(y_test_seq, y_pred)
print(f"RMSE: {rmse:.4f}")
print(f"R² Score: {r2:.4f}")

# Save model
model.save("models/final_model_local.h5")
print("✅ Model saved as models/final_model_local.h5")
