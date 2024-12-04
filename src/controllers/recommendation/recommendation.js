const axios = require("axios");
const Product = require("../../models/products/Products"); // Replace with your actual Mongoose model

exports.getRecommendation = async (req, res) => {
    const userInput = req.body;
    console.log("User Input:", userInput);

    try {
        // Send user input to the Python Flask API
        const pythonResponse = await axios.post("http://127.0.0.1:5000/recommendation", userInput);

        // Extract the product name from the Python API response
        const recommendedProduct = pythonResponse.data?.product_name || "No product recommended";

        console.log("Recommended Product from Python API:", recommendedProduct);

        // Query the database for products containing the recommended product name
        const matchingProducts = await Product.find({
            product_name: { $regex: recommendedProduct, $options: "i" }, // Case-insensitive search
        });

        let message = "Matching products found.";
        let externalLinks = [];

        // Check if no matching products were found
        if (matchingProducts.length === 0) {
            message = `The product "${recommendedProduct}" is not available in our store. You can check external sources like Amazon or Cerave for availability.`;
            externalLinks = [
                { name: "Amazon", url: `https://www.amazon.com/s?k=${encodeURIComponent(recommendedProduct)}` },
                { name: "Cerave", url: `https://www.cerave.com/search?q=${encodeURIComponent(recommendedProduct)}` },
            ];
        }

        console.log("Matching Products:", matchingProducts);

        // Prepare the response object
        const resultData = {
            recommendedProduct,
            matchingProducts,
            message,
            externalLinks, // Include links to external sources if no product is found
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
            message: "Failed to get product recommendation or query database",
            error: error.message,
        });
    }
};
