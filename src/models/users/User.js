const { path } = require("express/lib/application");
const mongoose = require("mongoose");
const { BOOLEAN } = require("sequelize");
const usersSchema = mongoose.Schema(
  {
    user_name: { type: String, default: null },
    email: String,
    document: { type: String, default: null },
    password: String,
    is_dermatologist: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
    },
    status :{
      type: String,
      default: "0",
    },
  },
  { timestamps: true }
);
const User = mongoose.model("Users", usersSchema);
module.exports = User;
