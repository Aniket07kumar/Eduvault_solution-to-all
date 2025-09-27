// server.js

const express = require('express');
const app = express();
const PORT = 3000;

// MIDDLEWARE: This teaches our server how to read JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API ENDPOINT: A specific URL for handling contact form submissions
app.post('/api/contact', (req, res) => {
    // req.body contains the data sent from the form
    const { name, email, subject, message } = req.body;

    console.log('--- New Contact Form Submission ---');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    
    // Send a success response back to the front end
    res.json({ success: true, message: 'Form submitted successfully!' });
});

app.listen(PORT, () => {
    console.log(`✅ Server is running successfully on http://localhost:${PORT}`);
});