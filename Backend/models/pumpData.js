const mongoose = require("mongoose");

const PumpDataSchema = new mongoose.Schema({
  date: { type: String, required: true },
  year: Number,
  pump_sets: Number,
  cumulative_pump_sets_energized: Number,
  groundwater_level: Number,
  average_rainfall_mm: Number,
  population: Number,
  rural_population: Number,
  urban_population: Number,
  growth_rate_percent: Number
});

module.exports = mongoose.model("PumpData", PumpDataSchema);
