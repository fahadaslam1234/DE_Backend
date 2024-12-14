
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
        user: "dermease4@gmail.com",
        pass: "kliu vadh jvti ynmx",
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

exports.sendEmailApprovals = async (user_email, status) => {
  try {
    const smtpTransport = nodemailer.createTransport({
      port: 465,
      secure: true,
      service: "Gmail",
      auth: {
        user: "dermease4@gmail.com",
        pass: "kliu vadh jvti ynmx",
      },
    });

    let subject = "";
    let htmlContent = "";

    if (status === "approved") {
      subject = "Application Approved - Welcome to DermEase!";
      htmlContent = `
        <p>Dear User,</p>
        <p>We are pleased to inform you that your application to join DermEase has been <strong>approved</strong>.</p>
        <p>You can now log in and start offering your services on our platform.</p>
        <p>Best regards,<br>DermEase Team</p>
      `;
    } else if (status === "rejected") {
      subject = "Application Rejected - DermEase";
      htmlContent = `
        <p>Dear User,</p>
        <p>We regret to inform you that your application to join DermEase has been <strong>rejected</strong>.</p>
        <p>If you have any questions or would like more information, please feel free to contact our support team.</p>
        <p>Best regards,<br>DermEase Team</p>
      `;
    } else {
      throw new Error("Invalid status provided for email");
    }

    const mailOptions = {
      to: user_email,
      from: "dermease4@gmail.com",
      subject: subject,
      html: htmlContent,
    };

    smtpTransport.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent successfully to:", user_email);
      }
    });
  } catch (error) {
    console.error("Error in sendEmailApprovals:", error.message);
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
