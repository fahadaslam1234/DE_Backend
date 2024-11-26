const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactUs/contactUs');

// POST route for contact form submission
router.post('/', (req, res, next) => {
  console.log('Contact Us Route Hit:', req.body); // Debugging log
  next();
}, contactController.sendContactForm);

module.exports = router;