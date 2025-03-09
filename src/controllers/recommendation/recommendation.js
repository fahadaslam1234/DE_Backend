const axios = require("axios");

exports.getRecommendation = async (req, res) => {
    const { skin_tone, skin_type, brand, category } = req.body;
    
    console.log("User Input:", { skin_tone, skin_type, brand, category });

    if (!skin_tone || !skin_type || !brand || !category) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: skin_tone, skin_type, brand, category",
        });
    }

    try {
        // Convert input values to lowercase to match ML model processing
        const userInput = {
            skin_tone: skin_tone.toLowerCase(),
            skin_type: skin_type.toLowerCase(),
            brand: brand.toLowerCase(),
            category: category.toLowerCase(),
        };

        // Send user input to the Python Flask API for recommendation
        const pythonResponse = await axios.post("http://127.0.0.1:5000/recommend_product", userInput);

        // Extract recommended product details from the Python API response
        const recommendedProduct = pythonResponse.data?.Product || null;
        const recommendedProductUrl = pythonResponse.data?.Product_URL || null;
        const source = pythonResponse.data?.source || "Model Prediction";

        console.log("Recommended Product from Python API:", recommendedProduct);
        console.log("Recommended Product URL:", recommendedProductUrl);

        if (!recommendedProduct) {
            return res.status(404).json({
                success: false,
                message: "No product recommendation found.",
            });
        }

        // Prepare the response object
        const resultData = {
            recommendedProduct,
            recommendedProductUrl,
            source, // Indicates "Exact Match" or "Model Prediction"
        };

        // Send the success response
        return res.status(200).json({
            success: true,
            data: resultData,
        });

    } catch (error) {
        console.error("Error getting recommendations:", error.message);

        // Send error response
        return res.status(500).json({
            success: false,
            message: "Failed to get product recommendations.",
            error: error.message,
        });
    }
};
