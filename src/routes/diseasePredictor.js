const express = require("express");
const multer = require("multer");
const path = require("path");
const diseasePredictorController = require("../controllers/diseasePredictor/diseasePredictor")
const router = express.Router();

// Set up multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Save files in the `uploads/` folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
    }
});

// Multer upload settings
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ✅ Ensure the field name in `upload.single()` matches Postman
router.post("/upload", upload.single("file"), diseasePredictorController.uploadImage);
router.get("/getAllPredictions",diseasePredictorController.getAllPredictions);

module.exports = router;
