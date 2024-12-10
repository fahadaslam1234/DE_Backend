const jwt = require("jsonwebtoken");
let User = require("../models/users/User");

exports.userAuth = async (req, res, next) => {
  try {
    if (req.headers && req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      if (token) {
        console.log("Token:", token);

        // Verify the token
        const decode = await jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");
        console.log("Decoded Token:", decode);

        // Find user by ID
        let user = await User.findById(decode.id);
        console.log("User Found:", user);

        if (user) {
          req.user = user;
          req.user_id = decode.id;
          req.role = decode.role;
          console.log("User Role:", req.role);

          next(); // Allow access to the route
        } else {
          console.error("User not found in the database");
          res.status(401).json({
            status: false,
            message: "Not authorized to access this route",
          });
        }
      } else {
        console.error("Token not provided in Authorization header");
        res.status(401).json({
          status: false,
          message: "Not authorized to access this route",
        });
      }
    } else {
      console.error("Authorization header is missing");
      res.status(401).json({
        status: false,
        message: "Not authorized to access this route",
      });
    }
  } catch (err) {
    console.error("Authorization Error:", err.message);
    res.status(401).json({
      status: false,
      error: err.message,
      message: "Not authorized to access this route",
    });
  }
};
