const Prediction = require('../models/predictionModel');

// GET: All prediction data
const getAllPredictions = async (req, res) => {
  try {
    const data = await Prediction.find().sort({ date: -1 });
    const formatted = data.map(p => ({
      date: p.date.toISOString().split('T')[0],
      rainfall: p.dailyRainfall,
      temperature: p.temperature,
      groundwaterLevel: p.groundwaterLevel,
      predictedGroundwaterLevel: p.predictedGroundwaterLevel ?? null
    }));
    res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching all predictions:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET: Prediction data by month
const getPredictionsByMonth = async (req, res) => {
  try {
    const month = req.params.month; // Format: YYYY-MM
    const [year, monthNum] = month.split('-');
    const startDate = new Date(`${year}-${monthNum}-01`);
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));
    const predictions = await Prediction.find({
      date: { $gte: startDate, $lt: endDate }
    }).sort({ date: 1 });

    if (!predictions || predictions.length === 0) {
      return res.status(404).json({ message: 'No data found for the selected month' });
    }

    const formatted = predictions.map(p => ({
      date: p.date.toISOString().split('T')[0],
      rainfall: p.dailyRainfall,
      temperature: p.temperature,
      groundwaterLevel: p.groundwaterLevel,
      predictedGroundwaterLevel: p.predictedGroundwaterLevel ?? null
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching predictions by month:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// POST: Add or update climate data (rainfall and temperature)
const addOrUpdateClimate = async (req, res) => {
  try {
    const { date, rainfall, temperature, source } = req.body;

    // 🔍 Use standardized ISO format and remove time portion
    const parsedDate = new Date(new Date(date).toISOString().split('T')[0]);

    // ✅ Check if a prediction already exists for the given date
    let existing = await Prediction.findOne({ date: parsedDate });

    if (existing) {
      // ✏️ Update existing climate data
      existing.dailyRainfall = rainfall;
      existing.temperature = temperature;
      existing.source = source || "admin-panel";
      await existing.save();
      return res.status(200).json({ message: '✅ Climate data updated' });
    } else {
      // ➕ Create new entry
      const newEntry = new Prediction({
        date: parsedDate,
        dailyRainfall: rainfall,
        temperature,
        source: source || "admin-panel"
      });
      await newEntry.save();
      return res.status(201).json({ message: '✅ Climate data added' });
    }
  } catch (err) {
    console.error('❌ Error in addOrUpdateClimate:', err.message);
    res.status(400).json({ error: err.message });
  }
};

// POST: Add or update prediction result
const addOrUpdatePrediction = async (req, res) => {
  try {
    const { date, predictedGroundwaterLevel, source } = req.body;

    // 🔍 Standardize date (remove time portion)
    const parsedDate = new Date(new Date(date).toISOString().split('T')[0]);

    // ✅ Check for existing entry
    let existing = await Prediction.findOne({ date: parsedDate });

    if (existing) {
      // ✏️ Update predicted groundwater level
      existing.predictedGroundwaterLevel = predictedGroundwaterLevel;
      existing.source = source || "model";
      await existing.save();
      return res.status(200).json({ message: '✅ Prediction updated' });
    } else {
      // ➕ Create new prediction entry
      const newEntry = new Prediction({
        date: parsedDate,
        predictedGroundwaterLevel,
        source: source || "model"
      });
      await newEntry.save();
      return res.status(201).json({ message: '✅ Prediction added' });
    }
  } catch (err) {
    console.error('❌ Error in addOrUpdatePrediction:', err.message);
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getAllPredictions,
  getPredictionsByMonth,
  addOrUpdateClimate,
  addOrUpdatePrediction
};
