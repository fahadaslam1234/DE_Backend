let Product = require("../../models/products/Products");
const { sendResponse } = require("../../helpers/response");

exports.createProduct = async (req, res, next) => {
  try {
    let {
      product_name,
      product_description,
      price
    } = req.body;
    if(!req.file || req.file == undefined || req.file== null){
      return await sendResponse(res,200,false,null,"Product Image is required!",{})
    }
   let product_image =req.file.path
    let createProduct = await Product.create({
      product_name: product_name,
      product_description: product_description,
      product_image: product_image,
      price:price
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
        "Something went wrong while creating project",
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
    let {
      product_id
    } = req.body
    let findProduct = await Product.findById(product_id);
    if (findProduct) {
      await sendResponse(
        res,
        200,
        true,
        null,
        "Data Retrieved Successfully",
        findProduct
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


