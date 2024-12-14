const axios = require("axios");
const Product = require("../../models/products/Products"); // Replace with your actual Mongoose model

exports.getRecommendation = async (req, res) => {
    const userInput = req.body;
    console.log("User Input:", userInput);

    try {
        // Send user input to the Python Flask API
        const pythonResponse = await axios.post("http://127.0.0.1:5000/recommendation", userInput);

        // Extract the recommended products array from the Python API response
        const recommendedProducts = pythonResponse.data?.recommended_products || [];
        const source = pythonResponse.data?.source || "Unknown Source";

        console.log("Recommended Products from Python API:", recommendedProducts);

        // Query the database for products matching any of the recommended product names
        const matchingProducts = await Product.find({
            product_name: { $in: recommendedProducts }, // Match any product name in the recommended array
        });

        let message = "Matching products found in the store.";
        let externalLinks = [];

        // Check if no matching products were found
        if (matchingProducts.length === 0) {
            message = `None of the recommended products are available in our store. You can check external sources like Amazon or Cerave for availability.`;

            // Generate external links for each recommended product
            externalLinks = recommendedProducts.map((product) => ({
                name: product,
                links: [
                    { name: "Amazon", url: `https://www.amazon.com/s?k=${encodeURIComponent(product)}` },
                    { name: "Cerave", url: `https://www.cerave.com/search?q=${encodeURIComponent(product)}` },
                ],
            }));
        }

        console.log("Matching Products:", matchingProducts);

        // Prepare the response object
        const resultData = {
            recommendedProducts,
            matchingProducts,
            message,
            externalLinks, // Include links to external sources if no matching product is found
            source, // Indicate whether it's from "Exact Match" or "Model Prediction"
        };

        // Send the success response
        return res.status(200).json({
            success: true,
            data: resultData,
        });
    } catch (error) {
        console.error("Error getting recommendations or querying database:", error.message);

        // Send the error response
        return res.status(500).json({
            success: false,
            message: "Failed to get product recommendations or query the database.",
            error: error.message,
        });
    }
};
