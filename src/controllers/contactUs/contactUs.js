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
      service: 'gmail', // e.g., Gmail (use your email provider)
      auth: {
        user: 'dermease4@gmail.com', // Replace with your email
        pass: 'kliu vadh jvti ynmx'  // Replace with your email password or app password
      }
    });

    // Mail options
    const mailOptions = {
      from: email,
      to: 'dermease4@gmail.com', // Replace with your email to receive messages
      subject: `New Contact Form Submission from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone}
        Message: ${message}
      `
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Send a success response
    res.status(200).json({ success: true, message: 'Contact form submitted successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send the contact form.' });
  }
};