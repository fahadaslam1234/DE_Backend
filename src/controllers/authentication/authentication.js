const { QueryTypes, Transaction } = require("sequelize");
const {
  findUserByEmail,
  emailAvailabilityCheck,
  findUserCustomField,
  userNameAvailabilityCheck,
  sendEmail,
  phoneNumberAvailabilityCheck,
  findUserByUserName
} = require("../../helpers/utils");

const bcrypt = require("bcrypt");
const User = require("../../models/users/User");
const fs = require("fs");
const path = require("path");
const { accessToken } = require("../../middleware/jwt_token");
const { sendResponse } = require("../../helpers/response");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
exports.registerUser = async (req, res, next) => {
  try {
    let {
      user_name,
      email,
      password,
      is_dermatologist,
      is_vendor
    } = req.body;
    console.log(req.body,"..................")
    let emailCheck = await emailAvailabilityCheck(email);
    console.log(emailCheck);
    if (emailCheck == false) {
      await sendResponse(res, 200, false, null, "User Email is Already Exist!", {});
    } else {
      let userNameCheck = await userNameAvailabilityCheck(user_name);
      if (userNameCheck == false || userNameCheck == 2) {
        await sendResponse(res, 200, false, null, "User Name is Already Exist!", {});
      } else {
          let document = null
          if(req.file != undefined && req.file !=null){
            document = req.file.path
          }
          let user_role = "user"
          let status = "0"
          if(JSON.parse(is_dermatologist)){
            user_role = "dermatologist"
            status = "1"
          }
          
            let hashedPass = await bcrypt.hash(password, 10);
            password = hashedPass;
            let new_user = await User.create({
              user_name: user_name,
              email: email,
              password: password,
              role: user_role,
              is_dermatologist:JSON.parse(is_dermatologist),
              is_vendor:JSON.parse(is_vendor),
              document:document,
              status: status,
            });
            if (new_user) {
              let token = await accessToken(new_user);
              await sendResponse(
                res,
                200,
                true,
                null,
                "User registered successfully",
                { new_user, token }
              );
            } else {
              await sendResponse(
                res,
                400,
                false,
                null,
                "Something went wrong please try again later",
                {}
              );
            }
          
        
      }
    }
  } catch (err) {
    console.log(err.message);
    await sendResponse(
      res,
      500,
      false,
      err.message,
      "Something went wrong please try again later",
      {}
    );
  }
};
exports.loginUser = async (req, res, next) => {
  try {
    let { user_name, password } = req.body;
    console.log(req.body);

    // Find user by username
    let user = await findUserByUserName(user_name);
    console.log(user);

    if (!user || user == false || user == 2) {
      // User not found or invalid credentials
      await sendResponse(res, 200, false, null, "Invalid credentials", {});
    } else {
      // Check if user status is '1' (approval pending)
      if (user.status === "1") {
        await sendResponse(
          res,
          200, // Forbidden
          false,
          null,
          "Your approval is pending. Please wait for admin approval.",
          {}
        );
        return; // Stop further execution
      }

      // Check if password matches
      if (await bcrypt.compare(password, user.password)) {
        // Generate token and return user details
        let token = await accessToken(user);
        user.password = null;

        await sendResponse(res, 200, true, null, "User login successfully", {
          user,
          token,
        });
      } else {
        // Invalid password
        await sendResponse(res, 200, false, null, "Invalid credentials", {});
      }
    }
  } catch (err) {
    // Handle errors
    console.log(err.message);
    await sendResponse(
      res,
      500,
      false,
      err.message,
      "Something went wrong, please try again later.",
      {}
    );
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    let user_id = req.user_id;
    let { current_password, new_password } = req.body;
    console.log(req.body);
    if (current_password == undefined || new_password == undefined) {
      await sendResponse(
        res,
        422,
        false,
        null,
        "All Inputs are Required..!",
        {}
      );
    } else {
      let user = await User.findById(user_id);
      if (user) {
        let isMatch = await bcrypt.compare(current_password, user.password);
        if (isMatch) {
          if (new_password.length >= 8) {
            bcrypt.hash(new_password, 10, async (err, hash) => {
              if (err) {
                return await sendResponse(
                  res,
                  400,
                  false,
                  err.message,
                  "Something went wrong please try again later",
                  {}
                );
              } else {
                user.password = hash;
                await user.save();
                await sendResponse(
                  res,
                  200,
                  true,
                  null,
                  "Password Updated Successfully",
                  {}
                );
              }
            });
          } else {
            await sendResponse(
              res,
              400,
              false,
              null,
              "Password length is too short",
              {}
            );
          }
        } else {
          await sendResponse(
            res,
            400,
            false,
            null,
            "Current password does not match",
            {}
          );
        }
      }
    }
  } catch (err) {
    console.log(err.message);
    await sendResponse(
      res,
      500,
      false,
      err.message,
      "Something went wrong please try again later",
      {}
    );
  }
};
exports.forgetPassword = async (req, res, next) => {
  try {
    const { user_email } = req.body;
    console.log("User email provided:", user_email);

    if (user_email) {
      const user = await User.findOne({ email: user_email });
      console.log("User found:", user);

      if (user) {
        const token = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET || 'default_secret_key',
          { expiresIn: process.env.JWT_EXPIRE || '1h' }
        );
        console.log("Generated token:", token);

        const link = `http://localhost:4200/reset-password?token=${token}`;
        console.log("Reset link:", link);

        await sendEmail(user.email, link);
        console.log("Email sent successfully");

        await sendResponse(
          res,
          200,
          true,
          null,
          "Reset Password Link Sent to your Email Please Check Your Email..!",
          {}
        );
      } else {
        await sendResponse(res, 400, false, null, "Email not found", {});
      }
    } else {
      await sendResponse(res, 422, false, null, "Provide Valid Email....", {});
    }
  } catch (err) {
    console.error("Error in forgetPassword:", err.message);
    await sendResponse(
      res,
      500,
      false,
      err.message,
      "Something went wrong please try again later",
      {}
    );
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { new_password } = req.body;
    const token = req.headers.authorization
      ? req.headers.authorization.split(' ')[1]
      : req.query.token; // Support token in query parameters

    const decode_token = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
    const user_id = decode_token.id;

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ message: "Password length is too short" });
    }

    user.password = await bcrypt.hash(new_password, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong, please try again later" });
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    let users = await User.find();
    if (users && users.length>0) {
        await sendResponse(
          res,
          200,
          true,
          null,
          "Data Retrieved Successfully..!",
          users
        );
      
    } else {
      await sendResponse(res, 400, false, null, "Users Does not Exist..", {});
    }
  } catch (err) {
    console.log(err);
    await sendResponse(
      res,
      500,
      false,
      err.message,
      "Something went wrong please try again later",
      {}
    );
  }
};
exports.deleteUserByID = async (req, res, next) => {
  try {
    let {
      user_id
    } =req.body
    let users = await User.findByIdAndDelete(user_id);
    if (users) {
        await sendResponse(
          res,
          200,
          true,
          null,
          "User Deleted Successfully..!",
          users
        );
      
    } else {
      await sendResponse(res, 400, false, null, "Users Does not Exist..", {});
    }
  } catch (err) {
    console.log(err);
    await sendResponse(
      res,
      500,
      false,
      err.message,
      "Something went wrong please try again later",
      {}
    );
  }
};
exports.getAllPendingDermatologist = async (req, res, next) => {
  try {
    let users = await User.find({status:"1"});
    if (users && users.length>0) {
        await sendResponse(
          res,
          200,
          true,
          null,
          "Users Fetched Successfully..!",
          users
        );
      
    } else {
      await sendResponse(res, 400, false, null, "Users Does not Exist..", {});
    }
  } catch (err) {
    console.log(err);
    await sendResponse(
      res,
      500,
      false,
      err.message,
      "Something went wrong please try again later",
      {}
    );
  }
};
exports.approvedOrDisapprovedPendingDermatologist = async (req, res, next) => {
  try {
    const { status, user_id } = req.body;

    // Validate request
    if (!user_id || !status) {
      return await sendResponse(
        res,
        400,
        false,
        null,
        "User ID and status are required.",
        {}
      );
    }

    // Find the user by ID
    const user = await User.findById(user_id);

    if (!user) {
      return await sendResponse(
        res,
        404,
        false,
        null,
        "User does not exist.",
        {}
      );
    }

    // Handle approved status
    if (status === "approved") {
      user.status = "0"; // Set status to "0" for successful approval
      user.is_dermatologist = true; // Mark as dermatologist if applicable
      await user.save(); // Save the changes
      return await sendResponse(
        res,
        200,
        true,
        null,
        "Signup successful and user approved!",
        user
      );
    }

    // Handle rejected status
    if (status === "rejected") {
      user.status = "2"; // Optional: Set a separate status for rejection if needed
      await user.save(); // Save the changes
      return await sendResponse(
        res,
        200,
        true,
        null,
        "Signup rejected.",
        user
      );
    }

    // Handle invalid status values
    return await sendResponse(
      res,
      400,
      false,
      null,
      "Invalid status value. Allowed values are 'approved' or 'rejected'.",
      {}
    );
  } catch (err) {
    console.error("Error in approvedOrDisapprovedPendingDermatologist:", err);

    return await sendResponse(
      res,
      500,
      false,
      err.message,
      "Something went wrong. Please try again later.",
      {}
    );
  }
};

