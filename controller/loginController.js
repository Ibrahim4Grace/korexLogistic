'use strict';
const express = require(`express`)
const bcrypt = require('bcryptjs');
const nodemailer = require(`nodemailer`);
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const  User  = require('../models/User');
const  Admin  = require('../models/admin');

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
 //Login attempts Limit 
const MAX_FAILED_ATTEMPTS = process.env.MAX_FAILED_ATTEMPTS;


  //USER REGISTRATION
const registrationPage = (req, res) => {
    const errors = req.flash('error') || []; // Ensure errors is an array even if it's undefined
    res.render('registration/register', { errors });
}

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

const registrationPagePost = async (req, res) => {

    const { senderName, senderGender, senderDob, senderNumber, selectMembership, senderEmail,senderRole, username, 
        password, password2, senderAddress, senderCity, senderState, postCode, country } = req.body;

    let errors = [];

    if ( !senderName || !senderGender || !senderDob || !senderNumber || !selectMembership || !senderEmail || !username || !password || !password2 || !senderAddress || !senderCity || !senderState || !postCode || !country ) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    if (password !== password2) {
        errors.push({ msg: 'Password does not match' });
    }

    if (!password || password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    try {

        const registeredAdminExists = await Admin.findOne({ $or: [{ adminEmail: senderEmail }, { adminUsername: username }] });

        if (registeredAdminExists) {
            if (registeredAdminExists.adminEmail === senderEmail) {
                errors.push({ msg: 'Email already registered' });
            }

            if (registeredAdminExists.adminUsername === username) {
                errors.push({ msg: 'Username already registered' });
            }
        }

        const registeredUserExists = await User.findOne({ $or: [{ senderEmail }, { username }]  });

        if (registeredUserExists) {
            if (registeredUserExists.senderEmail === senderEmail) {
                errors.push({ msg: 'Email already registered' });
            }

            if (registeredUserExists.username === username) {
                errors.push({ msg: 'Username already registered' });
            }
        }

        if (errors.length > 0) {
            return res.render('registration/register', {
                errors, senderName, senderGender, senderDob,
                senderNumber, selectMembership,senderEmail, 
                username, password, password2,senderAddress, 
                senderCity, senderState,postCode, country
            });
        }
           //Hash password
        const hash = await bcrypt.hash(password, 10);
        // Generate a unique verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');

        const newUser = new User({
            senderName, senderGender,senderDob, 
            senderNumber, selectMembership, senderEmail, 
            senderRole, username, password:hash, senderAddress, 
            senderCity, senderState, postCode, country, 
            verificationToken, // Add verification token to user data
            date_added: Date.now(), // Update the date_added field
            image: {
                data: fs.readFileSync(path.join(__dirname, '../public/userImage/' + req.file.filename)),
                contentType: 'image/png',
            },
        });

        await newUser.save();

        // Include the verification token in the email
        const hosting = process.env.BASE_URL || 'http://localhost:4040';
        const verificationLink = `${hosting}/verify-email/${encodeURIComponent(newUser.id)}/${encodeURIComponent(newUser.verificationToken)}`;

        // Email content for unverified user
        const unverifiedMsg = `
        <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
        <p>Dear ${senderName}, welcome to Korex Logistic Service.</p>
        <p>Please click <a href="${verificationLink}">here</a> to verify your email address.</p>
        <p>If you didn't register, please ignore this email.</p>
        <p>Best regards, <br> The Korex Logistic Team</p>`;


        const mailOptions = {
        from: process.env.NODEMAILER_EMAIL,
        to: senderEmail,
        subject: 'Welcome to Korex Logistic Company!',
        html: unverifiedMsg,
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
        req.flash('success_msg', 'Registration Successful. Confirm your email.');
        res.redirect('/registration/login');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while processing your request.');
        res.redirect('/registration/register');
    } 
};

// Verification endpoint
const verifyEmail = async (req, res) => {
    console.log('Verification Email Controller Method Called'); // Add this line
    const { id, token } = req.params;

    // Log the id parameter
    console.log('User ID:', id);
    console.log('Token:', token);

    try {
        // Find the user by ID and verification token
        console.log('User ID from URL:', id);
        const user = await User.findById(id);
        

        if (!user || user.verificationToken !== token) {
            // Invalid token or user not found
            return res.status(400).render('registration/verification-failed', {
                errors: [{ msg: 'Invalid verification link. Please try again or contact support.' }],
            });
        }

         // Check if the token has already been used
        if (user.isVerified) {
            return res.status(400).render('registration/verification-failed', {
                errors: [{ msg: 'Verification link has already been used. Please contact support if you have any issues.' }],
            });
        }

        // Check if the token has expired (1 hour expiration)
        const expirationTime = 60 * 60 * 1000; // 1 hour in milliseconds
        const currentTime = Date.now();
        const tokenCreationTime = user.date_added || 0; // Use 0 if date_added not available

        if (currentTime - tokenCreationTime > expirationTime) {
            // Token has expired
            return res.status(400).render('registration/verification-expired', {
                errors: [{ msg: 'Verification link has expired. Please request a new one.' }],
            });
        }

        // Mark the user as verified
        user.isVerified = true;
        user.verificationToken = undefined; // Clear the verification token
        await user.save();

          // Email content for verified user
          const verifiedMsg = `
          <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
          <p>Dear  ${user.senderName} ,  We are thrilled to welcome you to Korex Logistic Service. </p>
  
          <p>Here are some important details to get you started:</p>
          <ul>
              <li>Full Name: ${user.senderName}</li>
              <li>Membership: ${user.selectMembership}</li>
              <li>Email Address: ${user.senderEmail}</li>
              <li>Phone Number: ${user.senderNumber}</li>
              <li>Username: ${user.username}</li>
              <li>Home Address: ${user.senderAddress}</li>
              <li>City: ${user.senderCity}</li>
              <li>State: ${user.senderState}</li>
          </ul>
  
          <p>Thank you for registering with Korex Logistic Company! We are delighted to welcome you to our platform</p>
  
          <p>Your account has been successfully created, you can now explore all the features we have to offer.</p>
  
          <p>If you have any questions or need assistance, feel free to reach out to our support team at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you</p>
  
          <p>Best regards,<br>
          The Korex Logistic Team</p>`;

          // Send the second email for verified users
          const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: user.senderEmail,
            subject: 'Welcome to Korex Logistic Company!',
            html: verifiedMsg,
            attachments: [
                {
                    filename: 'shipping.jpg',
                    path: './public/img/shipping.jpg',
                    cid: 'shipping'
                }
            ]
        };

        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.log('Email sending error:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
        req.flash('success_msg', "Registration Completed. Please Login");
        // res.status(200).render('registration/verification-successful');
        res.redirect('/registration/login');
    } catch (error) {
        // Handle database errors or other issues
        console.error('Error in verifyEmail:', error);
        res.status(500).render('registration/verification-failed', {
            errors: [{ msg: 'An error occurred during email verification. Please try again or contact support.' }],
        });
    }
};

//verification link expired
const resendVerificationEmail = async (req, res) => {
    const { userEmail } = req.body;

    try {
        const user = await User.findOne({ senderEmail: userEmail });

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Check if the user is already verified
          if (user.isVerified) {
            return res.status(400).render('registration/verification-failed', {
                errors: [{ msg: 'User is already verified' }],
            });
        }

        // Generate a new verification token
        const newVerificationToken = crypto.randomBytes(20).toString('hex');

        // Update the user's verification token and save to the database
        user.verificationToken = newVerificationToken;
        user.isVerified = false; // Reset verification status
        await user.save();

        // Send the new verification email
        const verificationLink = `${process.env.BASE_URL || 'http://localhost:4040'}/verify-email/${encodeURIComponent(user.id)}/${encodeURIComponent(newVerificationToken)}`;
        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: user.senderEmail,
            subject: 'Verify Your Email - Korex Logistic Company',
            html: `<p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
            <p>Click <a href="${verificationLink}">here</a> to verify your email address.</p>
            <p>Best regards,<br>
            The Korex Logistic Team</p>`,
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
                return res.status(500).json({ error: 'Failed to resend verification email' });
            } else {
                console.log('Email sent:', info.response);
                return res.status(200).json({ message: 'Verification email resent successfully' });
            }
        });
    } catch (error) {
        console.error('Error in resendVerificationEmail:', error);
        return res.status(500).json({ error: 'An error occurred during email verification. Please try again or contact support.' });
    }
};


  //USER FORGETPASSWORD
const forgetPasswordPage = (req, res) => {
    res.render('registration/forgetPassword');
};

const forgetPasswordPost = async (req, res) => {
     // Using data destructuring
     const {  senderEmail} = req.body;
     let errors = [];
 
         // Check required fields
         if ( !senderEmail  ) {
            req.flash('error', 'Please fill all fields');
            return res.redirect('registration/forgetPassword');
        }
        try {
            // Check if the email is already registered in the User table
            const user = await User.findOne({ senderEmail });
            if (!user) {
                errors.push({ msg: 'Email not found in our database' });
                res.render('registration/forgetPassword', {
                    errors,
                    senderEmail   
                });
            } else {
                 // Fetch the user's name
                 const { senderName } = user;
                 const secret = process.env.JWT_SECRET + user.password;
                 const payload = {
                    senderEmail: user.senderEmail,
                    id: user.id
                };
                const token = jwt.sign(payload, secret, { expiresIn: process.env.TOKEN_EXPIRATION_TIME });
                const link = `${process.env.BASE_URL || 'http://localhost:4040'}/registration/resetPassword/${user.id}/${token}`;

                const msg =`
                <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
                 <p>Dear ${senderName},</p>
                 <p> We are writing to confirm your password recovery with Korex Logistic.</p>
                 <p>Reset your password here: <a href="${link}">Click here to reset your password</a></p>

                 <p>Warm regards,<br>
                 Korex Logistics</p>`;
     
                const mailOptions = {
                    from: process.env.NODEMAILER_EMAIL,
                    to: senderEmail,
                    subject: 'Recover your password with Korex Logistic',
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
          req.flash('success_msg', 'Kindly check your email to reset your password.');
          res.redirect('/registration/login'); 

        }
    }catch(err) {
        console.error('Error:', err.message);
        res.redirect('/registration/forgetPassword'); 
    }
};

// USER RESETPASSWORD SECTION
const resetPasswordPage = async (req, res) => {
    const { id, token } = req.params;
    let errors = [];
    let user;

    try {
        user = await User.findById(id);

        // check if this id exists in the db
        if (!user) {
            errors.push({ msg: 'Invalid id...' });
            return res.render('registration/forgetPassword', { errors, senderEmail: '' });
        }

        const secret = process.env.JWT_SECRET + user.password;

        try {
            const payload = jwt.verify(token, secret);
            // If the token is valid, render the reset password view
            res.render('registration/resetPassword', { id, token, senderEmail: user.senderEmail });
        } catch (error) {
            console.error('Error:', error.message);

            if (error.name === 'TokenExpiredError') {
              // Redirect the user to a page for expired links
                return res.status(400).render('registration/forgetPassword', {
                    errors: [{ msg: 'The password reset link has expired. Please request a new one.' }],
                    senderEmail: ''
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(400).render('registration/forgetPassword', {
                    errors: [{ msg: 'Invalid token. Please make sure the link is correct.' }],
                    senderEmail: ''
                });
            } else {
                // Handle other errors as needed
                return res.status(500).render('registration/forgetPassword', {
                    errors: [{ msg: 'Error resetting password. Please try again.' }],
                    senderEmail: ''
                });
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).render('registration/forgetPassword', {
            errors: [{ msg: 'Error resetting password. Please try again.' }],
            senderEmail: ''
        });
    }
};


const resetPasswordPost = async (req, res) => {
    const { id, token, password, password2 } = req.body;

    let errors = [];
    let user;  // Declare user variable outside the try block

    try {
        user = await User.findById(id);

        // check if this id exists in the db
        if (!user) {
            errors.push({ msg: 'Invalid id...' });
            return res.render('registration/forgetPassword', {
                errors,
                senderEmail: ''
            });
        }

        // check passwords match
        if (password !== password2) {
            errors.push({ msg: 'Passwords do not match' });
        }

        // Check password length
        if (password.length < 6) {
            errors.push({ msg: 'Password should be at least 6 characters' });
        }

        const secret = process.env.JWT_SECRET + user.password;
        const payload = jwt.verify(token, secret);

        // Hash the new password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        // Reset accountLocked to false
        user.accountLocked = false;

        // Save the user object to persist the changes
        await user.save();

        let phoneNumber = process.env.COMPANY_NUMBER;
        let emailAddress = process.env.COMPANY_EMAIL;
        // Send password change notification
        let msg = `
        <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
        <p>Dear ${user.senderName},</p>
        
        <p>We hope this message finds you well. We wanted to inform you about a recent update regarding your password.</p>
    
        <p>If you didn't make this change, kindly contact our department at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you</p>

        <p>We appreciate your continued dedication and patronization to our logistic team. Thank you for choosing to be a part of Korex Logistics...</p>
    
        <p>Best regards,<br>
        The Korex Logistic Team </p>`;

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: user.senderEmail,
            subject: 'Password Changed Confirmation',
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

        req.flash('success_msg', 'Password Successfully Updated. Please Login');
        res.redirect('/registration/login');
    } catch (error) {
        console.log(error.message);
        req.flash('error_msg', 'Error updating password. Please try again.');
        res.render('registration/forgetPassword', { errors, senderEmail: user ? user.senderEmail : '' });
    }

};

const verificationFailed = (req, res) => {
    res.render('verification-failed');
};
const verificationExpired = (req, res) => {
    res.render('verification-expired');
};

// USER LOGGIN SECTION
const loginPage = (req, res) => {
    const errors = req.flash('error_msg') || [];
    res.render('registration/login', { errors });
};

const loginPost = (req, res) => {
    const { username, password } = req.body;
    User.findOne({ username })
        .then((user) => {
            if (!user) {
                req.flash('error_msg', 'Invalid Username');
                return res.redirect('/registration/login');
            }

            if (!user.isVerified) {
                req.flash('error_msg', 'Please verify your email before logging in.');
                return res.redirect('/registration/login');
            }

            if (user.accountLocked) {
                req.flash('error_msg', 'Account locked. Contact Korex for assistance.');
                return res.redirect('/registration/login');
            }

            bcrypt.compare(password, user.password, (err, isVerified) => {
                if (err) {
                    console.error('bcrypt.compare error:', err);
                    req.flash('error_msg', 'Invalid Password 2 attenmpts left before access disabled.');
                    return res.redirect('/registration/login');
                }

                if (isVerified) {
                    // Successful login - reset failed login attempts
                    User.updateOne({ username }, { $set: { failedLoginAttempts: 0 } })
                        .then(() => {
                            // Set session variables and redirect
                            req.session.user_id = user._id;
                            req.session.username = user.username;
                            console.log('Session User ID:', req.session.user_id);
                            res.redirect('/users/welcome');
                        })
                        .catch((err) => {
                            console.error('Failed to update failed login attempts:', err);
                            req.flash('error_msg', 'Failed to update login attempts');
                            res.redirect('/registration/login');
                        });
                } else {
                    // Update failed login attempts
                    User.updateOne({ username }, { $inc: { failedLoginAttempts: 1 } })
                        .then(() => {
                            // Check if the account should be locked
                            User.findOne({ username })
                                .then((updatedUser) => {
                                    if (updatedUser.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                                        // Lock the account
                                        User.updateOne({ username }, { $set: { accountLocked: true } })
                                            .then(() => {
                                                req.flash('error_msg', 'Account locked. Contact Korex for assistance or reset Password.');
                                                res.redirect('/registration/login');
                                            })
                                            .catch((err) => {
                                                console.error('Failed to lock account:', err);
                                                req.flash('error_msg', 'Failed to lock account');
                                                res.redirect('/registration/login');
                                            });
                                    } else {
                                        req.flash('error_msg', 'Invalid Password');
                                        res.redirect('/registration/login');
                                    }
                                })
                                .catch((err) => {
                                    console.error('Failed to check failed login attempts:', err);
                                    req.flash('error_msg', 'Failed to check login attempts');
                                    res.redirect('/registration/login');
                                });
                        })
                        .catch((err) => {
                            console.error('Failed to update failed login attempts:', err);
                            req.flash('error_msg', 'Failed to update login attempts');
                            res.redirect('/registration/login');
                        });
                }
            });
        })
        .catch((err) => {
            console.error('Database error:', err);
            req.flash('error_msg', 'There was a Problem Selecting From the DB');
            res.redirect('/registration/login');
        });
};


module.exports = ({ registrationPage, upload, registrationPagePost,verifyEmail,resendVerificationEmail, forgetPasswordPage, forgetPasswordPost, resetPasswordPage, resetPasswordPost,verificationFailed,verificationExpired, loginPage, loginPost  });
