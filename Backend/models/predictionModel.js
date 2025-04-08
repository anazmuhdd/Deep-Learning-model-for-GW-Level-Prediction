const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  groundwaterLevel: Number,
  temperature: Number,
  dailyRainfall: Number,

  // Lag Features
  rain_lag_1: Number,
  temp_lag_1: Number,
  gw_lag_1: Number,
  rain_lag_3: Number,
  temp_lag_3: Number,
  gw_lag_3: Number,
  rain_lag_7: Number,
  temp_lag_7: Number,
  gw_lag_7: Number,

  // Rolling Features
  rain_rolling_7: Number,
  temp_rolling_7: Number,
  rain_rolling_14: Number,
  temp_rolling_14: Number,
  gw_rolling_7: Number,
  gw_rolling_14: Number,

  // Date-based Features
  month: Number,
  dayofyear: Number,
  sin_month: Number,
  cos_month: Number,
  sin_day: Number,
  cos_day: Number,

  // Target value
  target_gw_next_day: Number,

  // Optional: Predicted groundwater level by ML model
  predictedGroundwaterLevel: Number
});

module.exports = mongoose.model('Prediction', predictionSchema);
