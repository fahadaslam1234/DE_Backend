const Appointment = require("../../models/appointments/appointment");
const User = require("../../models/users/User");

const createAppointment = async (req, res) => {
  try {
    const { patientName, email, phone, doctor, date, time, message } = req.body;

    // Check if an appointment already exists for the same doctor, date, and time
    const existingAppointment = await Appointment.findOne({ doctor, date, time });

    if (existingAppointment) {
      return res.status(400).json({ message: "Appointment already exists for this date and time." });
    }

    // Create a new appointment if no duplicate is found
    const newAppointment = new Appointment({
      patientName,
      email,
      phone,
      doctor,
      date,
      time,
      message,
      status: "pending",
    });

    await newAppointment.save();
    res.status(201).json(newAppointment);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// pending appointments
const getAppointments = async (req, res) => {
  try {
      const doctorUsername = req.query.doctor; 

      if (!doctorUsername) {
          return res.status(400).json({ message: "Dermatologist username is required" });
      }
      const doctor = await User.findOne({ user_name: doctorUsername });
      if (!doctor) {
          return res.status(404).json({ message: "Doctor not found" });
      }
      const appointments = await Appointment.find({ status: "pending", doctor: doctor._id });

      if (appointments.length === 0) {
          return res.status(404).json({ message: "No pending appointments found for this dermatologist" });
      }

      res.status(200).json(appointments);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

// pending appointments
const getApprovedAppointments = async (req, res) => {
  try {
    const doctorUsername = req.query.doctor; 

    if (!doctorUsername) {
        return res.status(500).json({ message: "Dermatologist username is required" });
    }
    const doctor = await User.findOne({ user_name: doctorUsername });
    if (!doctor) {
        return res.status(500).json({ message: "Doctor not found" });
    }
    const appointments = await Appointment.find({ status: "approved", doctor: doctor._id });

    if (appointments.length === 0) {
        return res.status(500).json({ message: "No approved appointments found for this dermatologist" });
    }

    res.status(200).json(appointments);
} catch (error) {
    res.status(500).json({ error: error.message });
}
};


// Get a single appointment by ID
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: "Appointment ID and status are required" });
    }

    // Validate status (approved or rejected)
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
    }

    // Use findByIdAndUpdate to find and update the status in a single operation
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,  // Corrected from _id to id
      { status },  
      { new: true } // Return the updated document
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete an appointment
const deleteAppointment = async (req, res) => {
  try {
    const deletedAppointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!deletedAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get all Dermatologist
const getAllDermatologist = async(req, res)=>{
    try{
        const derms = await User.find({is_dermatologist: true});
        res.status(200).json(derms);
    }catch (error) {
        res.status(500).json({ error: error.message });
      }
}

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment,
  getAllDermatologist,
  getApprovedAppointments
};
