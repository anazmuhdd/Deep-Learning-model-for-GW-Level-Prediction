const PumpData = require("../models/PumpData");
const axios = require("axios");

exports.getPumpDataByMonthYear = async (req, res) => {
  const { year, month } = req.body;

  if (!year || !month) {
    return res.status(400).json({ error: "Year and month are required" });
  }

  try {
    // Construct date range for the specified month
    const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    console.log(startDate,endDate)
    const data = await PumpData.find({
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No data found for the specified month and year" });
    }

    return res.json({ year, month, data });
  } catch (error) {
    console.error("Error fetching pump data by month and year:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
exports.getAllPumpDataFormatted = async (req, res) => {
  try {
    const data = await PumpData.find().sort({ date: 1 });

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No pump data found in the database" });
    }

    const formatted = data.map(entry => {
      let formattedDate;

      // Safe handling for date field
      if (entry.date instanceof Date) {
        formattedDate = entry.date.toISOString().split('T')[0];
      } else if (typeof entry.date === 'string') {
        formattedDate = new Date(entry.date).toISOString().split('T')[0];
      } else {
        formattedDate = 'Invalid Date';
      }

      return {
        date: formattedDate,
        pump_sets: entry.pump_sets,
        cumulative_pump_sets_energized: entry.cumulative_pump_sets_energized,
        groundwater_level: entry.groundwater_level,
        average_rainfall_mm: entry['average_rainfall_(mm)'],
        population: entry.population,
        rural_population: entry.rural_population,
        urban_population: entry.urban_population,
        growth_rate_percent: entry.growth_rate_percent,
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching all pump data:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
