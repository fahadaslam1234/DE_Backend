
const User = require("../models/users/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
exports.emailAvailabilityCheck = async (value) => {
  try {
    let user = await User.findOne({ email: value });
    console.log("--------------- Email", user);
    if (user) {
      // console.log('--------------')
      return false;
    } else {
      return true;
    }
  } catch (err) {
    console.log(err.message);
    return 2;
  }
};
exports.findUserByEmail = async (value) => {
  try {
    let user = await User.findOne({ email: value });
    console.log(user);
    if (user) {
      return user;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err.message);
    return 2;
  }
};
exports.findUserByUserName = async (value) => {
  try {
    let user = await User.findOne({ user_name: value });
    console.log(user);
    if (user) {
      return user;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err.message);
    return 2;
  }
};
exports.findUserCustomField = async (field_name, value) => {
  try {
    let user = await User.findOne({ where: { [field_name]: value } });
    if (user) {
      return user;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err.message);
    return 2;
  }
};
exports.userNameAvailabilityCheck = async (value) => {
  try {
    let user = await User.findOne({ user_name: value });
    // console.log('---------------', user)
    if (user) {
      // console.log('--------------')
      return false;
    } else {
      return true;
    }
  } catch (err) {
    console.log(err.message);
    return 2;
  }
};
exports.sendEmail = async (user_email, link) => {
  try {
    console.log(link);
    let smtpTransport = nodemailer.createTransport({
      // name: envs.mail_server,
      // host: "smtp.gmail.com",
      port: 465,
      secure: true,
      service: "Gmail",
      auth: {
        user: "pilothuntapp@gmail.com",
        pass: "xxyucvkuxxxswpkv",
      },
      debug: true,
      // alternatives: [
      //   {
      //     contentType: "html",
      //   },
      // ],
    });
    let mailOptions = {
      to: user_email,
      from: "Gaetan@dronalis.com",
      subject: "Password Reset Token",
      text: "You are receiving this because you (or someone else) have requested the reset of the password for your account.",
      // html: `<html><body><a href=${link}>click here</a><br><a href=https://www.google.com>Google</a></body></html>`,
      alternatives: [
        {
          contentType: "text/html",
          content: `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p><span>To Reset Password:  </span>    <a href=${link}>Click Here</a>`,
        },
      ],
    };

    smtpTransport.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent to: " + info);
      }
    });
  } catch (error) {
    console.log(error, "email not sent");
  }
};
exports.phoneNumberAvailabilityCheck = async (value) => {
  try {
    let user = await User.findOne({ phone_number: value });
    console.log("---------------", user);
    if (user) {
      console.log("--------------");
      return false;
    } else {
      return true;
    }
  } catch (err) {
    console.log(err.message);
    return 2;
  }
};
