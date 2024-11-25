const express = require("express");
let AuthController = require("../controllers/authentication/authentication");
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
}).single('certification');
const router = express.Router();


router.post("/register", upload,AuthController.registerUser);
router.post("/login", AuthController.loginUser);
router.post("/change-password", userAuth, AuthController.updatePassword);
router.post("/forget-password", AuthController.forgetPassword);
router.post("/reset-password", userAuth, AuthController.resetPassword);
router.get("/getAllUsers",  AuthController.getAllUsers);
router.post("/delete",  AuthController.deleteUserByID);
router.get("/getAllPendingUsers",  AuthController.getAllPendingDermatologist);

module.exports = router;
