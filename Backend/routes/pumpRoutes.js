const express = require("express");
const router = express.Router();
const { getPumpDataByMonthYear, getAllPumpDataFormatted} = require("../controllers/pumpController");

router.post("/month-year-data", getPumpDataByMonthYear);
router.get('/all', getAllPumpDataFormatted); // ✅ New route
module.exports = router;