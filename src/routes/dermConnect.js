// src/routes/dermConnect.js
const express = require("express");
const { 
  createAppointment, 
  getAppointments, 
  getAppointmentById, 
  updateAppointmentStatus, 
  deleteAppointment, 
  getAllDermatologist,
  getApprovedAppointments
} = require("../controllers/dermConnect/dermConnect"); // Adjust path as needed

const router = express.Router();

router.post("/createAppointment", createAppointment);
router.get("/getAppointments", getAppointments);
router.get("/getApprovedAppointments", getApprovedAppointments);
router.get("/getAllDermatologist", getAllDermatologist);
router.get("/appointments/:id", getAppointmentById);
router.put("/updateAppointment/status", updateAppointmentStatus);
router.delete("/appointments/:id", deleteAppointment);

module.exports = router;
