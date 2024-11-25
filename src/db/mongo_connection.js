let mongoose = require("mongoose");
module.exports = async function () {
  try {
    // Database connection
    let connection = await mongoose.connect(
      "mongodb://127.0.0.1:27017/skin_care",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    if (connection) {
      console.log("MongoDB Database connected!");
    }
  } catch (err) {
    console.log("Cannot connect to the database", err);
  }
};
