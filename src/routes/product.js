const express = require("express");
let product = require("../controllers/product/product");
let { userAuth } = require("../middleware/auth");
let multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/documents')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().getTime() + '-' + file.originalname)
    }
})

const upload = multer({
    storage: storage
}).single('image');
const image_upload = multer({
  storage: storage
}).single('product_image');
const router = express.Router();

router.post(
  "/create",upload,
  product.createProduct
);
router.get(
  "/getAllProducts",
  product.getAllProducts
);
router.post(
  "/getSingleProduct",
  product.getProductByID
);
router.post(
  "/delete",
  product.deleteProductByID
);
router.post(
  "/update",image_upload,
  product.updateProductByID
);
module.exports = router;
