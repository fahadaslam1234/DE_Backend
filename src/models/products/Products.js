const { path } = require("express/lib/application");
const mongoose = require("mongoose");
const productSchema = mongoose.Schema(
  {
    product_name: String,
    product_description: String,
    product_image: String,
    is_deleted: {
      type: Boolean,
      default: false,
    },
    price:String,
    skin_conditions:String,
    skin_feel:String,
    ingredient_preferences:String
  },
  { timestamps: true }
);
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
