const nodemailer = require('nodemailer');

exports.sendContactForm = async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, Email, and Message are required.' });
  }

  try {
    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'dermease4@gmail.com', // Replace with your Gmail address
        pass: 'ufbo ejln nycl nxmw', // Replace with your Gmail app password
      },
      secure: true, // Ensures a secure connection
    });

    // Mail options
    const mailOptions = {
      from: `Contact Form <${email}>`,
      to: 'dermease4@gmail.com',
      subject: `New Contact Form Submission from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone || 'Not provided'}
        Message: ${message}
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Success response
    res.status(200).json({ success: true, message: 'Contact form submitted successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);

    // Specific error handling
    if (error.code === 'EDNS' || error.code === 'ETIMEOUT') {
      res.status(500).json({
        success: false,
        message: 'Network error: Unable to connect to the mail server.',
      });
    } else if (error.responseCode === 535 || error.responseCode === 454) {
      res.status(500).json({
        success: false,
        message: 'Authentication error: Please check your email credentials.',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send the contact form. Please try again later.',
      });
    }
  }
};
