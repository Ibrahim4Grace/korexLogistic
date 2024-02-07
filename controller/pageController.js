'use strict';
const express = require(`express`)
const ejs = require(`ejs`);
const nodemailer = require(`nodemailer`);
const app = express();
const ContactUs = require("../models/contactUs");
const  shippingLabel  = require('../models/shippingLabel');

// Send email to the applicant
const transporter = nodemailer.createTransport({
    service: process.env.MAILER_SERVICE,
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
});


const spinner = (req, res) => {
    res.render('spinner');
};

const indexPage = (req, res) => {
    setTimeout(() => {
        res.render('index');
    }, 3000);
};

const aboutPage = (req, res) => {
    res.render('about');
};
const servicePage = (req, res) => {
    res.render('service');
};

const trackingPage = (req, res) => {
    res.render('tracking');
};

const trackingPagePost = async (req, res) => {
    try {
        const { trackingID } = req.body;
        // Find the shipping label by trackingID
        const label = await shippingLabel.findOne({ trackingID: trackingID });
        // Set the label in the session
        req.session.label = label;
        // Render the spintracking page
        res.render('spinTracking', { label: label });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const trackingStatus = (req, res) => {
    const label = req.session.label;

    if (label) {
        res.render('trackingStatus', { label });
    } else {
        // Handle the case where label is not defined, e.g., redirect to an error page
        res.redirect('/trackingNotFound');
    }
};

const trackingNotFound = (req, res) => {
    res.render('trackingNotFound');
};

const contactPage = (req, res) => {
    res.render('contact');
};

const contactPagePost = async (req, res) => {
    const { contactUsName, contactUsEmail, contactUsNumber, contactUsSubject, contactUsMsg } = req.body;

    console.log('Received Data:', req.body);


    try {
        // Check required fields
        if (!contactUsName || !contactUsEmail || !contactUsNumber || !contactUsSubject || !contactUsMsg) {
            req.flash('error', 'Please fill all fields');
            return res.redirect('/contact');
        }

        // Additional validation if needed

        const newContactUs = new ContactUs({
            contactUsName,
            contactUsEmail,
            contactUsNumber,
            contactUsSubject,
            contactUsMsg,
        });

        await newContactUs.save();

        let phoneNumber = process.env.COMPANY_NUMBER;
        let emailAddress = process.env.COMPANY_EMAIL;
     

        const msg = `
            <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
            <p>Dear ${contactUsName}, Thank you for reaching out to Korex Logistics. We appreciate the opportunity to assist you.</p>
            <p>Your Contact Information:</p>
            <ul>
                <li>Full Name: ${contactUsName}</li>
                <li>Email: ${contactUsEmail}</li>
                <li>Contact No.: ${contactUsNumber}</li>
                <li>Subject: ${contactUsSubject}</li>
                <li>Message: ${contactUsMsg}</li>
            </ul>
            <p>Our team has received your inquiry, and we will be reviewing it shortly...</p>

            <p>If you have any urgent matters or questions in the meantime, please feel free to contact us directly at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you</p>

            <p>Thank you for considering Korex Logistics for your logistic needs.</p>
            <p>Best regards,</p>
            <p>The Korex Logistic Team</p>
        `;

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: contactUsEmail,
            subject: 'Thank you for reaching out to us!',
            html: msg,
            attachments: [
                {
                    filename: 'shipping.jpg',
                    path: './public/img/shipping.jpg',
                    cid: 'shipping'
                }
            ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email sending error:', error);
                req.flash('error', 'An error occurred while sending your message');
            } else {
                console.log('Email sent:', info.response);
                req.flash('success_msg', 'Message successfully sent.');
            }
            res.status(200).redirect('/');
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'An error occurred while processing your request');
        res.redirect('/');
    }
};


module.exports = ({ spinner, indexPage, aboutPage, servicePage, trackingPage, trackingPagePost, trackingStatus, trackingNotFound, contactPage, contactPagePost });
