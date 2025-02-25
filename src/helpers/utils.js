
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
        pass: "ufbo ejln nycl nxmw",
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
      from: "dermease4@gmail.com",
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
        pass: "ufbo ejln nycl nxmw",
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

exports.sendOrderConfirmationEmail = async (userEmail, order) => {
  try {
    const smtpTransport = nodemailer.createTransport({
      port: 465,
      secure: true,
      service: "Gmail",
      auth: {
        user: "dermease4@gmail.com",
        pass: "ufbo ejln nycl nxmw",
      },
    });

    // Formatting products into a table
    let productList = order.products.map((product, index) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${product.product_name}</td>
        <td style="padding: 10px; border: 1px solid #ddd;"><img src="${product.product_image}" width="50" alt="Product Image"></td>
        <td style="padding: 10px; border: 1px solid #ddd;">Rs. ${product.price}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${product.quantity}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">Rs. ${product.price * product.quantity}</td>
      </tr>
    `).join("");

    const mailOptions = {
      to: order.email,
      from: "dermease4@gmail.com",
      subject: "Order Confirmation - DermEase",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4CAF50;">Order Successfully Placed!</h2>
          <p>Dear <strong>${order.name}</strong>,</p>
          <p>Thank you for your order. Below are the details of your purchase:</p>
          <table style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; border: 1px solid #ddd;">#</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Product</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Image</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Price</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Quantity</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>${productList}</tbody>
          </table>
          <h3>Total Amount: Rs. ${order.totalAmount}</h3>
          <p><strong>Shipping Address:</strong> ${order.address}, ${order.city}, ${order.country}, ${order.zip}</p>
          <p><strong>Payment Method:</strong> ${order.shippingMethod.toUpperCase()}</p>
          <p>We will notify you once your order is shipped.</p>
          <p style="color: #4CAF50;">Thank you for shopping with DermEase!</p>
        </div>
      `,
    };

    smtpTransport.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("❌ Error sending email:", error);
      } else {
        console.log(`✅ Order Confirmation Email sent to ${userEmail}`);
      }
    });

  } catch (error) {
    console.error("❌ Error in sending email:", error.message);
  }
};
