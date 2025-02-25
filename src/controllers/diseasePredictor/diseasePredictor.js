const path = require("path");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const DiseasePrediction = require("../../models/diseasePredictor/diseasePredictor"); // MongoDB Model

// Function to handle image upload, send it to Flask, and save results in MongoDB
exports.uploadImage = async (req, res) => {
    try {
        console.log("[DEBUG] Request Received");
        console.log("[DEBUG] Request Body:", req.body);
        console.log("[DEBUG] Request Files:", req.file);

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        // ✅ Ensure `userId` is received
        const userId = req.body.userId || "anonymous";
        console.log("[INFO] Received User ID:", userId);

        // ✅ Correct File Path Processing
        const filePath = path.join("uploads", req.file.filename); // Relative path
        const fullFilePath = path.resolve(filePath); // Absolute path
        
        console.log("[INFO] Checking file path:", fullFilePath);

        // ✅ Ensure the uploaded file exists
        if (!fs.existsSync(fullFilePath)) {
            console.error("[ERROR] Uploaded file not found on server:", fullFilePath);
            return res.status(500).json({ error: "Uploaded file not found on server." });
        }

        console.log("[INFO] File exists, proceeding to Flask API...");

        // ✅ Send image to Flask API for prediction
        const formData = new FormData();
        formData.append("file", fs.createReadStream(fullFilePath));

        // ✅ Debugging FormData
        console.log("[DEBUG] FormData Headers:", formData.getHeaders());

        const flaskResponse = await axios.post("http://127.0.0.1:5000/predict_skin_disease", formData, {
            headers: { ...formData.getHeaders() }
        });

        console.log("[INFO] Flask Response Received:", flaskResponse.data);

        const predictedDisease = flaskResponse.data.predicted_disease;
        const confidence = flaskResponse.data.confidence;

        // ✅ Save image details and prediction in MongoDB
        const newPrediction = new DiseasePrediction({
            userId, // Save userId
            image: filePath,
            predictedDisease,
            confidence,
            uploadedAt: new Date()
        });

        await newPrediction.save();

        return res.json({
            message: "File uploaded and analyzed successfully!",
            filePath,
            predictedDisease,
            confidence,
            userId
        });

    } catch (error) {
        console.error("[ERROR] Image processing failed:", error.message);
        return res.status(500).json({ error: "Failed to process image.", details: error.message });
    }
};

// ✅ Get all predictions OR predictions by userId
exports.getAllPredictions = async (req, res) => {
    try {
        const { userId } = req.query; // Get userId from query params
        console.log(userId);

        let predictions;
        if (userId) {
            predictions = await DiseasePrediction.find({ userId });
        } else {
            predictions = await DiseasePrediction.find();
        }

        res.status(200).json(predictions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
