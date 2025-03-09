const mongoose = require("mongoose");

const DiseasePredictionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    image: { type: String, required: true },
    predictedDisease: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DiseasePrediction", DiseasePredictionSchema);
