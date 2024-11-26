const axios = require("axios");

exports.getRecommendation = async (req, res) => {
    const userInput = req.body;
    console.log("User Input:", userInput);

    try {
        // Send user input to the Python Flask API
        const pythonResponse = await axios.post("http://127.0.0.1:5000/recommendation", userInput);

        // Extract the product name from the Python API response
        const recommendedProduct = pythonResponse.data?.product_name || "No product recommended";

        // Prepare the response object
        const resultData = {
            recommendedProduct,
        };

        console.log("Recommendation Result:", resultData);

        // Send the success response
        return res.status(200).json({
            success: true,
            data: resultData,
        });
    } catch (error) {
        console.error("Error getting recommendations:", error.message);
        // Send the error response
        return res.status(500).json({
            success: false,
            message: "Failed to get product recommendation",
            error: error.message,
        });
    }
};
