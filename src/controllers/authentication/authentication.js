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
      is_dermatologist
    } = req.body;
    console.log(req.body,"..................")
    let emailCheck = await emailAvailabilityCheck(email);
    console.log(emailCheck);
    if (emailCheck == false) {
      await sendResponse(res, 200, false, null, "User Already Exist!", {});
    } else {
      let userNameCheck = await userNameAvailabilityCheck(user_name);
      if (userNameCheck == false || userNameCheck == 2) {
        await sendResponse(res, 200, false, null, "User Already Exist!", {});
      } else {
          let document = null
          if(req.file != undefined && req.file !=null){
            document = req.file.path
          }
          let user_role = "user"
          if(JSON.parse(is_dermatologist)){
            user_role = "dermatologist"
          }
          
            let hashedPass = await bcrypt.hash(password, 10);
            password = hashedPass;
            let new_user = await User.create({
              user_name: user_name,
              email: email,
              password: password,
              role: user_role,
              is_dermatologist:JSON.parse(is_dermatologist),
              document:document
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
    let user = await findUserByUserName(user_name);
    console.log(user);
    if (user == false || user == 2) {
      await sendResponse(res, 200, false, null, "Invalid credentials", {});
    } else {
      if (await bcrypt.compare(password, user.password)) {
        await user.save();
        let token = await accessToken(user);
        user.password = null;

        await sendResponse(res, 200, true, null, "User login successfully", {
          user,
          token,
        });
      } else {
        await sendResponse(res, 200, false, null, "Invalid credentials", {});
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
    if (user_email != undefined) {
      const user = await User.findOne({ email: user_email });
      if (user) {
        const token = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET,
          {
            expiresIn: process.env.JWT_EXPIRE,
          }
        );
        const link = `https://pilot.thecbt.cyou/api/v1/authentication/reset/${token}`;
        await sendEmail(user.email, link);
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
exports.resetPassword = async (req, res, next) => {
  try {
    const { new_password } = req.body;

    const token = req.headers.authorization.split(" ")[1];

    const decode_token = jwt.decode(token);

    const user_id = decode_token.id;
    let user = await User.findById({ _id: user_id });
    if (user) {
      if (new_password.length >= 8) {
        const encryptedPassword = await bcrypt.hash(new_password, 10);
        const change_password = await User.updateOne(
          { _id: user_id },
          {
            password: encryptedPassword,
          }
        );
        await sendResponse(
          res,
          200,
          true,
          null,
          "Password Changed Successfully..!",
          {}
        );
      } else {
        await sendResponse(
          res,
          422,
          false,
          null,
          "Password Lenth is Too Short",
          {}
        );
      }
    } else {
      await sendResponse(res, 400, false, null, "User Does not Exist..", {});
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
exports.approvedOrDisapprovedPendingDermatologist = async (req, res, next) => {
  try {
    let {
      status,
      user_id
    } = req.body
    let users = await User.findById(user_id);
    if (users) {
      users.status = status
        await sendResponse(
          res,
          200,
          true,
          null,
          "Action Taken Successfully..!",
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