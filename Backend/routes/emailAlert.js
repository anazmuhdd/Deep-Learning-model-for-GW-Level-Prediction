// routes/emailAlert.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/send-warning-emails", async (req, res) => {
  const { alerts } = req.body;

  if (!alerts || alerts.length === 0) {
    return res.status(400).json({ error: "No low groundwater data to report." });
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER, // Your email
      pass: process.env.MAIL_PASS  // Your password or app password
    }
  });

  // Recipients
  const recipients = [
    "helpdesk-nwic@gov.in",
    "mohammedanazar.b22cs1135@mbcet.ac.in",
    "twadho@gmail.com",
    "commr.coimbatore@tn.gov.in"
  ];

  // Format alert message
  const message = alerts.map(a => `📅 Date: ${a.date}, 🔻 GW Level: ${a.groundwaterLevel ?? a.predictedGroundwaterLevel} m`).join("\n");

  const mailOptions = {
    from: `"Groundwater Alert" <${process.env.MAIL_USER}>`,
    to: recipients.join(","),
    subject: "⚠️ Groundwater Level Alert - Below Safe Threshold",
    text: `Following days reported groundwater level below threshold:\n\n${message}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ status: "✅ Alert email sent to government authorities." });
  } catch (error) {
    console.error("Mail error:", error);
    res.status(500).json({ error: "Failed to send email." });
  }
});

module.exports = router;
