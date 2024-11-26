const axios = require("axios");
const response = require("../../helpers/response");

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
            recommendedProduct
        };

        console.log("Recommendation Result:", resultData);

        // Send the success response
        return response.success(res, resultData);
    } catch (error) {
        console.error("Error getting recommendations:", error.message);
        // Send the error response
        return response.error(res, "Failed to get product recommendation", 500, error.message);
    }
};