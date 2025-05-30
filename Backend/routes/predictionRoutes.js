const express = require('express');
const router = express.Router();
const {
  getAllPredictions,
  getPredictionsByMonth,
  addOrUpdateClimate,
  addOrUpdatePrediction,
  updateGroundwaterLevel
} = require('../controllers/predictionController');

// Get all predictions
router.get('/all', getAllPredictions);

// Get predictions by month (YYYY-MM)
router.get('/:month', getPredictionsByMonth);

// Add or update climate data
router.post('/admin/climate', addOrUpdateClimate);
router.post('/admin/groundwater',updateGroundwaterLevel);
// Add or update prediction
router.post('/admin/predict', addOrUpdatePrediction);

module.exports = router;
