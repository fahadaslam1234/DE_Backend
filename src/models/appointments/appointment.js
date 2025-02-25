const { path } = require("express/lib/application");
const mongoose = require("mongoose");
const { BOOLEAN } = require("sequelize");
const appointmentsSchema = mongoose.Schema(
  {
    patientName: String,
    email: String,
    phone:String,
    doctor: String,
    date:Date,
    time:String,
    message:String,
    status:{type:String, default:"pending"}
  },
  { timestamps: true }
);
const Appointment = mongoose.model("Appointments", appointmentsSchema);
module.exports = Appointment;
