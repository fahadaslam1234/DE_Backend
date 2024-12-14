let Product = require("../../models/products/Products");
const { sendResponse } = require("../../helpers/response");
const axios = require("axios");
const path = require("path");
const { ChimeSDKMeetings } = require("aws-sdk");
exports.createProduct = async (req, res, next) => {
  try {
    let { product_name, product_description, price,skin_conditions,skin_feel,ingredient_preferences } = req.body;

    // Check if the file is uploaded
    if (!req.file || req.file === undefined || req.file === null) {
      return await sendResponse(res, 200, false, null, "Product Image is required!", {});
    }

    // Get the uploaded file path
    let originalPath = req.file.path;

    // Extract and sanitize the file name
    let originalFileName = path.basename(originalPath);
    let sanitizedFileName = originalFileName.replace(/^\d+-/, ""); // Remove numbers from the start

    // Rebuild the path with the sanitized file name
    let product_image = path.join(path.dirname(originalPath), sanitizedFileName);

    // Optional: Rename the file in the file system
    const fs = require("fs");
    fs.renameSync(originalPath, product_image);

    // Save product details to the database
    let createProduct = await Product.create({
      product_name: product_name,
      product_description: product_description,
      product_image: product_image,
      skin_conditions: skin_conditions,
      skin_feel: skin_feel,
      ingredient_preferences:ingredient_preferences,
      price: price
    });

    if (createProduct) {
      await sendResponse(
        res,
        200,
        true,
        null,
        "Product Created Successfully",
        createProduct
      );
    } else {
      await sendResponse(
        res,
        400,
        false,
        null,
        "Something went wrong while creating the product",
        {}
      );
    }
  } catch (err) {
    console.log(err.message);
    await sendResponse(
      res,
      500,
      false,
      err.message,
      "Something went wrong, please try again later",
      {}
    );
  }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    let findProducts = await Product.find({is_deleted:false});
    if (findProducts && findProducts.length > 0) {
      // Add full URL to product_image
      const baseUrl = `${req.protocol}://${req.get("host")}/`; // Example: http://localhost:3000/
      findProducts = findProducts.map(product => ({
        ...product.toObject(),
        product_image: `${baseUrl}${product.product_image}`
      }));
      await sendResponse(
        res,
        200,
        true,
        null,
        "Data Retrieved Successfully",
        findProducts
      );
    } else {
      await sendResponse(
        res,
        200,
        false,
        null,
        "No Data Found",
        {}
      );
    }

  } catch (err) {
    console.log(err.message);
    await sendResponse(
      res,
      500,
      false,
      err.message,
      "something went wrong please try again later",
      {}
    );
  }
};
exports.getProductByID = async (req, res, next) => {
  try {
    const { product_id } = req.query; // Use req.query for GET requests
    const findProduct = await Product.findById(product_id);

    if (findProduct) {
      const baseUrl = `${req.protocol}://${req.get("host")}/`; // Example: http://localhost:3000/
      
      // Modify the product object to include the full image URL
      const productWithImage = {
        ...findProduct.toObject(),
        product_image: `${baseUrl}${findProduct.product_image}`
      };

      await sendResponse(
        res,
        200,
        true,
        null,
        "Data Retrieved Successfully",
        productWithImage
      );
    } else {
      await sendResponse(
        res,
        200,
        false,
        null,
        "No Data Found",
        {}
      );
    }
  } catch (err) {
    console.error(err.message);
    await sendResponse(
      res,
      500,
      false,
      err.message,
      "Something went wrong. Please try again later.",
      {}
    );
  }
};


exports.deleteProductByID = async (req, res, next) => {
  try {
    let {
      product_id
    } = req.body
    console.log(req.body)
    let findProduct = await Product.findByIdAndDelete(product_id);
    if (findProduct) {
      await sendResponse(
        res,
        200,
        true,
        null,
        "Product Deleted Successfully",
        {}
      );
    } else {
      await sendResponse(
        res,
        200,
        false,
        null,
        "No Data Found",
        {}
      );
    }

  } catch (err) {
    console.log(err.message);
    await sendResponse(
      res,
      500,
      false,
      err.message,
      "something went wrong please try again later",
      {}
    );
  }
};
exports.updateProductByID = async (req, res, next) => {
  try {
    let {
      product_name,
      product_description,
      price,
      product_id
    } = req.body
    console.log(req.body)
    console.log(req.file)
    let findProduct = await Product.findById(product_id);
    if (findProduct) {
      if(product_name){
        findProduct.product_name = product_name
      }
      if(product_description){
        findProduct.product_description = product_description
      }
      if(price){
        findProduct.price = price
      }
      if(req.file && req.file!=undefined && req.file !=null){
        findProduct.product_image = req.file.path
      }
      await findProduct.save()
      await sendResponse(
        res,
        200,
        true,
        null,
        "Product Update Successfully",
        {}
      );
    } else {
      await sendResponse(
        res,
        200,
        false,
        null,
        "No Data Found",
        {}
      );
    }

  } catch (err) {
    console.log(err.message);
    await sendResponse(
      res,
      500,
      false,
      err.message,
      "something went wrong please try again later",
      {}
    );
  }
};


