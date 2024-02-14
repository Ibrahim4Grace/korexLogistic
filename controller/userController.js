const express = require(`express`)
const axios = require('axios');
const bcrypt = require('bcryptjs');
const nodemailer = require(`nodemailer`);
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();
const PDFDocument = require('pdfkit');
const generateTrackingID = require('../utils/tracking');
const  shippingLabel  = require('../models/shippingLabel');
const  User  = require('../models/User');
const Notification = require('../models/notification');
const notificationIo = io.of('/notifications');
const https = require('https');

const lodash = require('lodash');

// Send email to the applicant
const transporter = nodemailer.createTransport({
    service: process.env.MAILER_SERVICE,
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
});

const phoneNumber = process.env.COMPANY_NUMBER;
const emailAddress = process.env.COMPANY_EMAIL;

   //user landing page 
const usersLandingPage = async (req, res) => {
    try {
        console.log('Checking session variables...');
        if (!req.session.user_id && !req.session.username) {
            console.log('Session variables not found. Redirecting to login...');
            req.flash('error_msg', 'Please login to access the App');
            return res.redirect('/registration/login');
        }
        console.log('Session variables found. Retrieving user information...');
        const uID = req.session.user_id;
        // Find the user by user_id
        const user = await User.findById(uID);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/registration/login');
        }
         // Emit user ID to Socket.IO when the user logs in
         io.emit('loginId', { userId: user._id });

               //setting my pagination
        const page = parseInt(req.query.page) || 1;
        const perPage = 10;  // Number of items per page
        const totalPosts = await shippingLabel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);
 
        const myShippingHistory = await shippingLabel.find({ userId: user._id })
        .sort({ date_added: -1 }) // Sort by date_added in descending order
        .skip((page - 1) * perPage)
        .limit(perPage);
       
        res.render('users/welcome', {user, myShippingHistory, totalPages, currentPage: page  });
    } catch (err) {
        req.flash('error_msg', err);
        res.redirect('/registration/login');
    }
};

 // create shipping label
const createShippingLabel = async (req, res) => {
    try {
        if (!req.session.user_id && !req.session.username) {
            req.flash('error_msg', 'Please login to access the App');
            return res.redirect('/registration/login');
        }
        const uID = req.session.user_id;

        // Find the user by user_id
        const user = await User.findById(uID);

        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/registration/login');
        }
        const newTrackingID =  generateTrackingID();

        res.render('users/createLabel', { user, newTrackingID});
       
    } catch (err) {
        req.flash('error_msg', err);
        res.redirect('/registration/login');
    }
};

 // post my label
const createLabelPagePost =  async(req, res) => {

    const { senderName, senderEmail, senderNumber, selectMembership, senderAddress, senderCity, senderState, shippingMethod, recipientName, recipientEmail, recipientNumber, recipientAddress, recipientCity, recipientState,shippingAmount, trackingID } = req.body;

    const userId = req.session.user_id;
    let errors = [];

    if (!senderName || !senderEmail || !senderNumber || !selectMembership || !senderAddress || !senderCity || !senderState || !shippingMethod || !recipientName || !recipientEmail || !recipientNumber || !recipientAddress || !recipientCity || !recipientState || !shippingAmount) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    if (errors.length > 0) {
        return res.render('users/createLabel', {
            errors, senderName, senderEmail, senderNumber, selectMembership, senderAddress,
            senderCity, senderState, shippingMethod, recipientName, recipientEmail,
            recipientNumber, recipientAddress, recipientCity, recipientState,shippingAmount
        });
    }
 
    try {

      let newTrackingID = trackingID;
        const existingShippingLabel = await shippingLabel.findOne({ trackingID });
        if (existingShippingLabel) { 
            newTrackingID =  generateTrackingID(); // Generate a new tracking number
        }


        const newShippingLabel = new shippingLabel({
            senderName, senderEmail, senderNumber, selectMembership, senderAddress, senderCity,
            senderState, shippingMethod, recipientName, recipientEmail, recipientNumber,
            recipientAddress, recipientCity, recipientState, shippingAmount, trackingID: newTrackingID,
            userId,statusMessage: 'Unknown Status check back later' // Set initial status here
        
        });
        await newShippingLabel.save();

        // Create a notification for the admin
        const newNotification = new Notification({
            userId: userId, // Assuming you have the user ID who created the label
            message: `A new shipping label has been created by ${senderName}. Tracking ID: ${newTrackingID}`,
           senderName: `${senderName}`,
        });
        await newNotification.save();
        
        // Emit a new event to notify the admin through Socket.io
        notificationIo.emit('new-notification', newNotification);

        let msg = `
        <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
        <p>Dear ${senderName},</p>
        <p>Congratulations! Your shipping label has been successfully created.</p>
        <p>This marks an important step in ensuring a smooth and efficient shipping process for your package.</p>

        <p>Shipping Details:</p>
        <ul>
            <li>Sender Name: ${senderName}</li>
            <li>Tracking Number: ${trackingID}</li>
            <li>Shipping Method: ${shippingMethod}</li>
            <li>Shipping Method: ${shippingAmount}</li>
            <li>Recipient Name: ${recipientName}</li>
            <li>Recipient Address: ${recipientAddress}</li>
            <li>Recipient City: ${recipientCity}</li>
            <li>Recipient State: ${recipientState}</li>
        </ul>

        <p>Next Steps:</p>
        <ul>
            <li>Print the shipping information sent to your email and attach it securely to your package.</li>
            <li>Drop off your package at the nearest Shipping Carrier location or schedule a pickup.</li>
            <li>Feel free to track your package using the provided tracking number on our website Korexlogistic.com tracking system.</li>
        </ul>

        <p>If you have any questions or need assistance, feel free to reach out to our support team at support@korexlogistic.com.</p>

        <p>Best regards,</p>
        <p>The Korex Logistic Team</p>`;

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: senderEmail,
            subject: 'Shipping Label Created Successfully!',
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
                console.log('Email sending error:', error);
            } else {
                console.log('Email sent:', info.response);
            }
           });
        console.log('Shipping label created successfully');
        setTimeout(() => {
            res.status(200).redirect('/users/shippingHistory');
        }, 5000); 
    } catch (error) {
        console.error('Error creating shipping label:', error);
        req.flash('error', 'An error occurred while processing your request.');
        res.redirect('/users/createLabel');
    }
};

// shipping histrory
const shippingHistory = async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.user_id && !req.session.username) {
            req.flash('error_msg', 'Please login to access the App');
            return res.redirect('/registration/login');
        }
         const uID = req.session.user_id;
        // Find the user by user_id
        const user = await User.findById(uID);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/registration/login');
        }
       //setting my pagination
       const page = parseInt(req.query.page) || 1;
       const perPage = 10;  // Number of items per page
       const totalPosts = await shippingLabel.countDocuments();
       const totalPages = Math.ceil(totalPosts / perPage);

       const myShippingHistory = await shippingLabel.find({ userId: user._id })
       .sort({ date_added: -1 }) // Sort by date_added in descending order
       .skip((page - 1) * perPage)
       .limit(perPage);

        res.render('users/shippingHistory', {user, myShippingHistory, totalPages, currentPage: page});
    } catch (err) {
        req.flash('error_msg', err);
        res.redirect('/registration/login');
    }
};

const viewLabelInfo = async (req, res) => {
    try {

        // Check if user is logged in
        if (!req.session.user_id && !req.session.username) {
            req.flash('error_msg', 'Please login to access the App');
            return res.redirect('/registration/login');
        }
         const uID = req.session.user_id;
        // Find the user by user_id
        const user = await User.findById(uID);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/registration/login');
        }

        const userId = req.params.mu_id;
        
           // Fetch shippingLabel details based on the shippingLabelId
         const shippingInfo = await shippingLabel.findOne({ _id: userId });
        
         if (!shippingInfo) {
            return res.status(404).send(`Label information not found`);
        }

        res.render(`users/viewUserLabel`, { shippingInfo,user });
    } catch (err) {
        console.error(err);
        res.status(500).send(`There's a problem selecting from DB`);
    }
};

//Edit User information
const editUserInformation = async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.user_id && !req.session.username) {
            req.flash('error_msg', 'Please login to access the App');
            return res.redirect('/registration/login');
        }      
        const uID = req.session.user_id;
         // Find the user by user_id
         const user = await User.findById(uID);

         if (!user) {
             req.flash('error_msg', 'User not found');
             return res.redirect('/registration/login');
         }

        res.render('users/editInformation', { user  });
    } catch (err) {
        req.flash('error_msg', err);
        res.redirect('/registration/login');
    }

};

    //USER IMAGE FOLDER
    let storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, './public/userImage/')
        },
        filename: (req, file, cb) => {
            cb(null, file.fieldname + '_' + Date.now())
        }
  });
    
  const upload = multer({ storage: storage });

//Edit user information
const editUserInformationPost = async (req, res) => {
    try {
         // Check if user is logged in
         if (!req.session.user_id && !req.session.username) {
            req.flash('error_msg', 'Please login to access the App');
            return res.redirect('/registration/login');
        }
        
        const userId = req.session.user_id;
        const user = await User.findById(userId);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/registration/login');
        }
        
        const { senderName, senderGender, senderDob, senderNumber, senderEmail, username,password, senderAddress, senderCity, senderState } = req.body;

        // Check if a new image was uploaded
        let newImage = {};
        if (req.file && req.file.filename) {
            newImage = {
                data: fs.readFileSync(path.join(__dirname, '../public/UserImage/' + req.file.filename)),
                contentType: 'image/png',
            };
        }

        // Retain the existing image or use the new image
        const userImage = req.file ? newImage : (user ? user.image : {});

        // Hash the new password if it has been changed
        let userPasswordHash;
        if (password && password !== user.password) {
            userPasswordHash = bcrypt.hashSync(password, 10);
        } else {
            // If the password hasn't changed, retain the existing hashed password
            userPasswordHash = user.password;
        }

        // Update the document with the hashed password
        await User.findByIdAndUpdate(userId, {
            $set: {
                senderName, 
                senderGender, 
                senderDob, 
                senderNumber, 
                senderEmail, 
                username, 
                password,
                senderAddress, 
                senderCity, 
                senderState, 
                image: userImage,
                password: userPasswordHash, // Update the password only if it has changed
                user
            }
        });          
        let msg = `
        <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
        <p>Dear   ${senderName} ,  We hope this message finds you well. We wanted to inform you that there has been an update to your information in our database. The details that have been modified include:</p>

        <p>New Information:</p>
        <ul>
            <li>Full Name: ${senderName}</li>
            <li>Username: ${username}</li>
            <li>Email Address: ${senderEmail}</li>
            <li>DOB: ${senderDob}</li>
            <li>Phone Number: ${senderNumber}</li>
            <li>Home Address: ${senderAddress}</li>
            <li>City: ${senderCity}</li>
            <li>State : ${senderState}</li>
        </ul>

        <p>Please review the changes to ensure that they accurately reflect your information. If you believe any information is incorrect or if you have any questions regarding the update, please don't hesitate to reach out to our administrative team at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you</p>

        <p>We value your continued association with us, and it's important to us that your records are kept up-to-date for your convenience and our records.</p>

        <p>Thank you for your prompt attention to this matter. We appreciate your trust in our services and are here to assist you with any further inquiries you may have..</p>

        <p>Best regards,<br>
        The Korex Logistic Team </p>`;

                 
        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: senderEmail,
            subject: 'Information Update Confirmation',
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
                console.log('Email sending error:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        req.flash('success_msg', 'Dear ' + senderName + ', Your Information Successfully Updated');
        res.redirect('/users/welcome');
    } catch (error) {
        console.error('Error updating admin:', error);
        req.flash('error_msg', 'An error occurred while updating user information.');
        res.redirect('/users/welcome');
    }

};

//Contact Us
const contactUsPage = async (req, res) => {
    try {
        if (!req.session.user_id || !req.session.username) {
            req.flash('error_msg', 'Please login to access the App');
            return res.redirect('/registration/login');
        }
        const uId = req.session.user_id;
        const user = await User.findById(uId);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/registration/login');
        }
    
        res.render('users/contactUs', { user, userId: uId });
    } catch (err) {
        req.flash('error_msg', err.message || 'An error occurred');
        res.redirect('/registration/login');
    }
};

// logout User
const logout = (req, res) => {

    if (!req.session.user_id && !req.session.username) {
        req.flash('error_msg', "Please Login to access app")
        res.redirect('/registration/login');
    } else {
        req.session.destroy();
        res.redirect('/')

    }
};

//CALCULATING SHIPMENT FEES
const shippingAmount = (req, res) => {

    const { shippingMethod, recipientState } = req.body;

      // Define your shipping prices here (same as in your server code)
      const shippingPrices = {
          "Regular 6-7Days": {
              basePrice: 4000,  
              statePrices: {
                  // Define prices for each state for express shipping
              "Abuja": 7000, "Abia": 7000, "Adamawa": 7000, "Akwa Ibom": 7000,
              "Anambra": 7000,"Bauchi": 7000, "Bayelsa": 7000,"Benue": 7000,
              "Borno": 7000,"Cross River": 7000, "Delta": 7000,"Ebonyi": 7000,
              "Enugu": 7000,"Gombe": 7000,"Imo": 7000,"Jigawa": 10000,"Kaduna": 10000,
              "Kano": 10000,"Katsina": 10000,"Kebbi": 10000,"Kogi": 60000,"Nasarawa": 10000,
              "Niger": 10000,"Plateau": 8000,"Rivers": 8000,"Sokoto": 10000,"Taraba": 10000,
              "Yobe": 10000,"Zamfara": 10000,
              
              }
              
          },
  
          "Express 2-3Days": {
              basePrice: 7000,  
              statePrices: {
                  // Define prices for each state for express shipping
              "Abuja": 10000, "Abia": 10000, "Adamawa": 10000, "Akwa Ibom": 10000,
              "Anambra": 10000,"Bauchi": 10000,  "Bayelsa": 10000,"Benue": 10000,
              "Borno": 10000,"Cross River": 10000, "Delta": 10000,"Ebonyi": 10000,
              "Enugu": 10000,"Gombe": 10000,"Imo": 10000,"Jigawa": 15000,"Kaduna": 15000,
              "Kano": 15000,"Katsina": 15000,"Kebbi": 15000,"Kogi": 80000,"Nasarawa": 15000,
              "Niger": 15000,"Plateau": 10000,"Rivers": 10000,"Sokoto": 15000,"Taraba": 15000,
              "Yobe": 15000,"Zamfara": 15000,
              
              }
          }
  
      };
      // Calculate the shipping amount based on the selected state and shipping method
    let selectedShippingMethod = shippingPrices[shippingMethod];
    let shippingFee = selectedShippingMethod.statePrices[recipientState] || selectedShippingMethod.basePrice;

    // Send the shipping fee as a response
    res.json({ shippingFee: shippingFee.toFixed(2) });
};

const generatePdfShipping = (req, res) =>{

   const {senderName,senderNumber,senderAddress,senderCity,senderState,recipientName,recipientNumber,recipientAddress,recipientCity,recipientState,trackingID,shippingAmount,deliveryDay,deliveryDate,deliveryMonth,statusMessage } = req.query;
    // Create a new PDF document
    const doc = new PDFDocument();
  
    // Pipe the PDF to the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent('generated-pdf.pdf')}`);
    doc.pipe(res);
  
    // Add content to the PDF using the provided data
    doc.text(`Sender Name: ${senderName}\n`);
    doc.text(`Sender Number: ${senderNumber}\n`);
    doc.text(`Sender Address: ${senderAddress}\n`);
    doc.text(`Sender City: ${senderCity}\n`);
    doc.text(`Sender State: ${senderState}\n\n`);

    doc.text(`Recipient Name: ${recipientName}\n`);
    doc.text(`Recipient Number: ${recipientNumber}\n`);
    doc.text(`Recipient Address: ${recipientAddress}\n`);
    doc.text(`Recipient City: ${recipientCity}\n`);
    doc.text(`Recipient State: ${recipientState}\n\n`);

    doc.text(`Tracking ID: ${trackingID}\n`);
    doc.text(`Shipping Amount: ${shippingAmount}\n`);
    doc.text(`Delivery Day: ${deliveryDay}\n`);
    doc.text(`Delivery Date: ${deliveryDate}\n`);
    doc.text(`Delivery Month: ${deliveryMonth}\n\n`);

    doc.text(`Status Message: ${statusMessage}\n`);
  
    // End the PDF document
    doc.end();
};


const makePayment = async (req, res) => {
    try {
        const { name, email, amount } = req.body; // Extract relevant data from request body

        // Prepare the parameters for initializing the transaction
        const params = JSON.stringify({
            name,
            email,
            amount: amount * 100, // Convert amount to kobo (1 Naira = 100 kobo)
           
        });

        // Set up options for making the request to Paystack API
        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: '/transaction/initialize',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
                'Content-Type': 'application/json'
            }
        };

        // Make the request to initialize the transaction
        const clientReq = https.request(options, async apiRes => {
            let data = '';
            apiRes.on('data', (chunk) => {
                data += chunk;
            });
            apiRes.on('end', async () => {
                const responseData = JSON.parse(data);
                // Send the authorization URL back to the client
                res.json(responseData);
            });
        }).on('error', error => {
            console.error(error);
            res.status(400).json({ error: error.message });
        });

        clientReq.write(params);
        clientReq.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

const verifyPayment = async (reference, res) => {
    try {
        // Encode the reference parameter
        const encodedReference = encodeURIComponent(reference);

        // Make request to Paystack API to verify payment
        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: `/transaction/verify/${encodedReference}`, // Use the encoded reference
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
                'Content-Type': 'application/json'
            }
        };

        // Make the verification request
        const apiRes = await new Promise((resolve, reject) => {
            const req = https.request(options, res => {
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(JSON.parse(data));
                });
            });

            req.on('error', error => {
                reject(error);
            });

            req.end();
        });

        // Handle the response from Paystack API
        console.log(apiRes);

        // Check if payment verification was successful
        if (apiRes && apiRes.status != null && apiRes.status === true) {
            console.log('Payment verified successfully');
            res.status(200).json({ message: 'Payment verified successfully' });
        } else {
            console.log('Payment verification failed:', apiRes.message);
            res.status(400).json({ error: 'Payment verification failed', message: apiRes.message });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Error verifying payment' });
    }
};







// const verifyPayment = async (reference, res) => {
//     try {
//         // Make request to Paystack API to verify payment
//         const options = {
//             hostname: 'api.paystack.co',
//             port: 443,
//             path: `/transaction/verify/${reference}`,
//             method: 'GET',
//             headers: {
//                 Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
//                 'Content-Type': 'application/json'
//             }
//         };

//         // Make the verification request
//         const apiRes = await new Promise((resolve, reject) => {
//             const req = https.request(options, res => {
//                 let data = '';
//                 res.on('data', chunk => {
//                     data += chunk;
//                 });
//                 res.on('end', () => {
//                     resolve(JSON.parse(data));
//                 });
//             });

//             req.on('error', error => {
//                 reject(error);
//             });

//             req.end();
//         });

//         // Handle the response from Paystack API
//         console.log('Payment verification response:', apiRes);

//         // Check if payment verification was successful
//         if (apiRes && apiRes.status != null && apiRes.status === true) {
//             console.log('Payment verified successfully');
//             res.status(200).json({ message: 'Payment verified successfully' });
//         } else {
//             console.log('Payment verification failed:', apiRes.message);
//             res.status(400).json({ error: 'Payment verification failed', message: apiRes.message });
//         }
//     } catch (error) {
//         console.error('Error verifying payment:', error);
//         res.status(500).json({ error: 'Error verifying payment' });
//     }
// };




 module.exports = ({ usersLandingPage, createShippingLabel, createLabelPagePost, shippingHistory,viewLabelInfo, editUserInformation, upload, editUserInformationPost, contactUsPage, logout ,shippingAmount,generatePdfShipping,  makePayment, verifyPayment });

