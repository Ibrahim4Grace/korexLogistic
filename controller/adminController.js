const express = require(`express`)
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require(`nodemailer`);
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const  Admin  = require('../models/admin');
const  User  = require('../models/User');
const  shippingLabel  = require('../models/shippingLabel');
const  { Staff, StaffPayment }  = require('../models/staff');
const Chat = require('../models/chat');
const generateTrackingID = require('../utils/tracking');
const   CompanyExpenses = require('../models/companyExpenses');
const Notification = require('../models/notification');
const  generateStatusMessage  = require('../utils/statusMessages');
const  Payment   = require('../models/payment');
const https = require('https');

// Passport config
const initializePassport = require('../config/passport');

initializePassport(passport, async (adminUsername) => {
  try {
    const admin = await Admin.find({ adminUsername: adminUsername });
    return admin;
  } catch (error) {
    // Handle any errors here
    console.error(error);
    return null;
  }
});

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

               //admin login 
const adminloginPage = (req, res) => {
    console.log('Rendering admin welcome page');
    res.render('admin/welcomeAdmin');
};

const adminloginPagePost = (req, res, next) => {
    passport.authenticate('local-admin', {
        successRedirect: '/admin/dashboard',
        failureRedirect: '/admin/welcomeAdmin',
        failureFlash: true,
    })(req, res, next);
};


            // admin DASHBOARD
const adminDashboard = async (req, res) => {
    const admin = req.user; // Access the authenticated admin user
    res.render('admin/dashboard', {  admin}); 
};


const newNotification = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 10; // Number of items per page
        const totalPosts = await Notification.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);
        
        const admin = req.user;
        
        const notifications = await Notification.find()
        .sort({ date_added: -1 }) // Sort by date_added in descending order
        .skip((page - 1) * perPage)
        .limit(perPage);
        // notificationIo.to(admin.socketId).emit('newNotification');
        
        res.render('admin/newNotification', { notifications,admin, totalPages, currentPage: page, });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const deleteNotification = (req, res) => {
    const mu_id = req.params.mu_id;
    Notification.findByIdAndDelete(mu_id)
    .then(() => {
        req.flash(`success_msg`, 'Notification deleted successfully');
        res.redirect(`/admin/newNotification`)
    })
    .catch((error) => {
        console.error('Error deleting admin:', error);
        req.flash('error_msg', 'Error deleting admin');
        res.redirect('/admin/dashboard');
    })
};

// Add Admin
const addAdmin = (req, res) => {
    const admin = req.user;
    res.render('admin/addAdmin', {admin});
};

let st = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/adminImage/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '_' + Date.now())
    }
});

const uploads = multer({ storage: st });

const addAdminPost = async (req, res) =>{
    const { adminFullName, adminUsername, adminPassword, adminPassword2, adminEmail, adminNumber, adminAddress, adminCity, adminState, adminRole, adminDob,adminEmergencyName, adminEmergencyNumber, adminEmployDate } = req.body;

        const admin = req.user; 
        let errors = [];
    
        //check required fields
        if (!adminFullName || !adminUsername || !adminPassword || !adminPassword2 || !adminEmail || !adminNumber || !adminAddress || !adminCity || !adminState || !adminRole  || !adminDob || !adminEmergencyName || !adminEmergencyNumber || !adminEmployDate) {
            errors.push({ msg: 'Please fill in all fields' });
        }
    
        //check passwords match
        if (adminPassword !== adminPassword2) {
            errors.push({ msg: 'Password do not match' });
        }
    
        //Check password length
        if (adminPassword.length < 6) {
            errors.push({ msg: 'Password should be at least 6 characters' });
        }

        try {

            const registeredUserExists = await Admin.findOne({ $or: [{ senderEmail: adminEmail }, { username: adminUsername }] });

            if (registeredUserExists) {
                if (registeredUserExists.senderEmail === adminEmail) {
                    errors.push({ msg: 'Email already registered' });
                }

                if (registeredUserExists.username === adminUsername) {
                    errors.push({ msg: 'Username already registered' });
                }
            }

            const registeredAdminExists = await Admin.findOne({ $or: [{ adminEmail }, { adminUsername }] });

            if (registeredAdminExists) {
                if (registeredAdminExists.adminEmail === adminEmail) {
                    errors.push({ msg: 'Email already registered' });
                }

                if (registeredAdminExists.adminUsername === adminUsername) {
                    errors.push({ msg: 'Username already registered' });
                }
            }

          
            //if all check complete
            if (errors.length > 0) {
                return res.render('admin/addAdmin', {
                    errors, adminFullName, adminUsername,adminPassword,
                    adminPassword2, adminEmail, adminNumber, adminAddress,
                    adminCity,adminState, adminRole, adminDob,adminEmergencyName,
                    adminEmergencyNumber, adminEmployDate,admin,
                });
            }
            
            const hash = await bcrypt.hash(adminPassword, 10);
        
            const newAdmin = new Admin({
                adminFullName,
                adminUsername,
                adminPassword : hash,
                adminEmail,
                adminNumber,
                adminAddress,
                adminCity,
                adminState,
                adminRole,
                adminDob,
                adminEmergencyName,
                adminEmergencyNumber,
                adminEmployDate,
                image: {
                    data: fs.readFileSync(path.join(__dirname, '../public/adminImage/' + req.file.filename)),
                    contentType: 'image/png',
                },
                admin, 
            });

            await newAdmin.save();
                // Your email sending code here
                let msg = `
                <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
                <p>Dear   ${adminFullName} ,   We are thrilled to welcome you to Korex Logistic Service. Your expertise and dedication to patient care make you a valuable addition to our logistics family. </p>

                <p>Here are some important details to get you started:</p>
                <ul>
                    <li>Full Name: ${adminFullName}</li>
                    <li>Username: ${adminUsername}</li>
                    <li>Phone Number: ${adminNumber}</li>
                    <li>Address: ${adminAddress}</li>
                    <li>City: ${adminCity}</li>
                    <li>Role: ${adminRole}</li>
                    <li>Emergency Name: ${adminEmergencyName}</li>
                    <li>Emergency Number : ${adminEmergencyNumber}</li>
                </ul>

                <p>We are delighted to welcome you to our platform.</p>

                <p>If you have any questions or need assistance, feel free to reach out to our support team at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you</p>

                <p>Thank you for your prompt attention to this matter. We appreciate your trust in our services and are here to assist you with any further inquiries you may have..</p>

                <p>Best regards,<br>
                The Korex Logistic Team</p>`;

                const mailOptions = {
                    from: process.env.NODEMAILER_EMAIL,
                    to: adminEmail,
                    subject: 'Welcome to Korex Logistic Company!',
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

                req.flash('success_msg', 'Dear ' + adminFullName + ', Your account has been successfully created.');
                res.redirect('/admin/allAdmin');
            } catch (error) {
                console.error(error);
                req.flash('error', 'An error occurred while processing your request.');
                res.redirect('/admin/dashboard');
            }
};

const viewAllAdmin = async (req, res) =>{
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 8; // Number of items per page
        const totalPosts = await Admin.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);
        
        const admin = req.user;
        
        const adminResults = await Admin.find()
        .sort({ date_added: -1 }) // Sort by date_added in descending order
        .skip((page - 1) * perPage)
        .limit(perPage);
        
        res.render('admin/allAdmin', { adminResults,admin, totalPages, currentPage: page });
    } catch (error) {
                        // Handle any errors, e.g., by sending an error response
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const adminProfilePage = async (req, res) => {
    try {
        const profileId = req.params.mu_id;
        
           // Fetch patient appointment details based on the appointmentId
         const adminInfo = await Admin.findOne({ _id: profileId });
        
         if (!adminInfo) {
            return res.status(404).send(`Admin information not found`);
        }
        const admin = req.user; 
        
           // Render the viewAppoint page with appointment details
        res.render(`admin/adminProfile`, { adminInfo, admin });
    } catch (err) {
        console.error(err);
        res.status(500).send(`There's a problem selecting from DB`);
    }
};

const editAdminPage = (req, res) => {
    const admin = req.user;
    const mv = Admin.findOne({ _id: req.params.mu_id })
    
    .then((recs) => {
    
        res.render(`admin/editAdmin`, { editAdmin: recs, admin })
    })
    
    .catch((err) => {
    
        res.send(`There's a problem selecting from DB`);
        console.log(err);
    })
};

const editAdminPagePost = async (req, res) => {
    try {
        const mu_id = req.params.mu_id;
        const admin = req.body;
        const { adminFullName, adminUsername, adminPassword, adminEmail, adminNumber, adminAddress, adminCity, adminState, adminRole, adminDob, adminEmergencyName, adminEmergencyNumber, adminEmployDate } = req.body;
        
        // Check if a new image was uploaded
        let newImage = {};
        if (req.file && req.file.filename) {
            newImage = {
                data: fs.readFileSync(path.join(__dirname, '../public/adminImage/' + req.file.filename)),
                contentType: 'image/png',
            };
        }
        
         // Find the existing admin to get the current image
         const existingAdmin = await Admin.findById(mu_id);
        
        // Retain the existing image or use the new image
        const adminImage = req.file ? newImage : (existingAdmin ? existingAdmin.image : {});
        
        // Hash the new password if it has been changed
        let adminPasswordHash;
        if (adminPassword && adminPassword !== existingAdmin.adminPassword) {
            adminPasswordHash = bcrypt.hashSync(adminPassword, 10);
        } else {
            // If the password hasn't changed, retain the existing hashed password
            adminPasswordHash = existingAdmin.adminPassword;
        }
        
         // Update the document with the hashed password
        await Admin.findByIdAndUpdate(mu_id, {
            $set: {
                adminFullName, adminUsername, adminEmail,
                adminNumber, adminAddress, adminCity,
                adminState, adminRole, adminDob,
                adminEmergencyName, adminEmergencyNumber,
                adminEmployDate, image: adminImage,
                adminPassword: adminPasswordHash, // Update the password only if it has changed
                admin,
            }
        });

        let msg = `
        <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
        <p>Dear   ${adminFullName} ,   We wanted to inform you that there has been an update to your information in our database. The details that have been modified include:. </p>

        <p>New Information:</p>
        <ul>
            <li>Full Name: ${adminFullName}</li>
            <li>Username: ${adminUsername}</li>
            <li>Email Address: ${adminEmail}</li>
            <li>Phone Number: ${adminNumber}</li>
            <li>Home Address: ${adminAddress}</li>
            <li>City: ${adminCity}</li>
            <li>State: ${adminState}</li>
            <li>Role: ${adminRole}</li>
            <li>Emergency Name : ${adminEmergencyName}</li>
            <li>Emergency Number : ${adminEmergencyNumber}</li>
        </ul>

        <p>Please review the changes to ensure that they accurately reflect your information. If you believe any information is incorrect or if you have any questions regarding the update, please don't hesitate to reach out to our administrative team at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you</p>

        <p>We value your continued association with us, and it's important to us that your records are kept up-to-date for your convenience and our records.</p>

        <p>Thank you for your prompt attention to this matter. We appreciate your trust in our services and are here to assist you with any further inquiries you may have..</p>

        <p>Best regards,<br>
        <p>The Korex Logistic Team</p>`;

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: adminEmail,
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
        req.flash('success_msg', 'Dear ' + adminFullName + ', Your Information Successfully Updated');
        res.redirect('/admin/allAdmin');
    } catch (error) {
        console.error('Error updating admin:', error);
        req.flash('error_msg', 'An error occurred while updating admin information.');
        res.redirect('/admin/editAdmin/' + mu_id); // Redirect to the edit page with an error message
    }

};

const deleteAdmin = (req, res) => {
    const mu_id = req.params.mu_id;
    Admin.findByIdAndDelete(mu_id)
    .then(() => {
        req.flash(`success_msg`, 'Admin deleted successfully');
        res.redirect(`/admin/allAdmin`)
    })
    .catch((error) => {
        console.error('Error deleting admin:', error);
        req.flash('error_msg', 'Error deleting admin');
        res.redirect('/admin/dashboard');
    })

};

const addNewUser = (req, res) => {
    const admin = req.user;
    res.render('admin/addNewUser', {admin});
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

const addNewUserPost = async (req, res) => {
    const { senderName, senderGender, senderDob, senderNumber, selectMembership, senderEmail,senderRole, username, 
        password, password2, senderAddress, senderCity, senderState, postCode, country } = req.body;
    
    let errors = [];
    const admin = req.user;

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
            return res.render('admin/addNewUser', {
                errors,senderName,senderGender, 
                senderDob, senderNumber,selectMembership, 
                senderEmail, username, password, 
                password2,senderAddress, senderCity,
                senderState, postCode, country,admin
            });
        }

        const hash = await bcrypt.hash(password, 10);
        
        const newUser = new User({  
            senderName, 
            senderGender, 
            senderDob, 
            senderNumber, 
            selectMembership, 
            senderEmail, 
            senderRole,
            username, 
            password:hash, 
            senderAddress, 
            senderCity, 
            senderState, 
            postCode, 
            country,
            image: {
                data: fs.readFileSync(path.join(__dirname, '../public/userImage/' + req.file.filename)),
                contentType: 'image/png',
            },
            admin,
        
        });

        await newUser.save();

        // Your email sending code here
        let msg = `
        <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
        <p>Dear   ${senderName} ,  We are thrilled to welcome you to Korex Logistic Service. </p>

        <p>Here are some important details to get you started:</p>
        <ul>
            <li>Full Name: ${senderName}</li>
            <li>Membership: ${selectMembership}</li>
            <li>Email Address: ${senderEmail}</li>
            <li>Phone Number: ${senderNumber}</li>
            <li>Username: ${username}</li>
            <li>Home Address: ${senderAddress}</li>
            <li>City: ${senderCity}</li>
            <li>State: ${senderAsenderStatedress}</li>
        </ul>

        <p>Thank you for registering with Korex Logistic Company! We are delighted to welcome you to our platform</p>
        <p>Your account has been successfully created, you can now explore all the features we have to offer.</p>
        <p>If you have any questions or need assistance, feel free to reach out to our support team at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you</p>

        <p>Best regards,<br>
        The Korex Logistic Team</p>`;

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: senderEmail,
            subject: 'Welcome to Korex Logistic Company!',
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
       req.flash('message', "Registration Successful. User can now Login");
        res.redirect('/admin/allRegisteredUser');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while processing your request.');
        res.redirect('/admin/addNewUser');
    }

};

const registeredUser = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 8; // Number of items per page
        const totalPosts = await User.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);
        
        const admin = req.user;
        
        const registeredUsers = await User.find()
            .sort({ date_added: -1 }) // Sort by date_added in descending order
            .skip((page - 1) * perPage)
            .limit(perPage);
        
        res.render('admin/allRegisteredUser', { registeredUsers, admin, totalPages, currentPage: page });
    } catch (error) {
        // Handle any errors, e.g., by sending an error response
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const searchUsers = async (req, res) => {
    try {
        const admin = req.user;
        const userSenderName = req.body.senderName;
        const query = {
            senderName: { $regex: new RegExp(userSenderName, 'i') }
        };

        const page = parseInt(req.query.page) || 1;
        const perPage = 8; // Number of items per page
        const totalPosts = await User.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);
      
        const registeredUsers = await User.find(query)
        .sort({ date_added: -1 }) // Sort by date_added in descending order
        .skip((page - 1) * perPage)
        .limit(perPage);
        res.render('admin/searchUsers', {  admin, registeredUsers, totalPages, currentPage: page}); 
    } catch (err) {
        console.error(err);
        res.redirect('admin/allRegisteredUser');
    }
};

const userProfile = async (req, res) => {
    try {
        const profileId = req.params.mu_id;
        
        // Fetch patient appointment details based on the appointmentId
        const userInfo = await User.findOne({ _id: profileId });
        
        if (!userInfo) {
            return res.status(404).send(`Admin information not found`);
        }
        const admin = req.user; 
        
         // Render the viewAppoint page with appointment details
         res.render(`admin/userProfile`, { userInfo, admin });
        } catch (err) {
            console.error(err);
            res.status(500).send(`There's a problem selecting from DB`);
        }
};

const editUserProfile = (req, res) => {
    const admin = req.user;
    const mv = User.findOne({ _id: req.params.mu_id })
    .then((recs) => {
        res.render(`admin/editUser`, { editMyUser: recs, admin })
    })
    .catch((err) => {
        res.send(`There's a problem selecting from DB`);
        console.log(err);
    })

};

const editUserProfilePost = async (req, res) => {
    try {
        const mu_id = req.params.mu_id;
        const admin = req.body;
        const { senderName, senderGender, senderDob, senderNumber, selectMembership, senderEmail,username, 
            password, senderAddress, senderCity, senderState, postCode, country } = req.body;
        
            // Check if a new image was uploaded
            let newImage = {};
            if (req.file && req.file.filename) {
                newImage = {
                    data: fs.readFileSync(path.join(__dirname, '../public/UserImage/' + req.file.filename)),
                    contentType: 'image/png',
                };
            }
        
             // Find the existing admin to get the current image
            const existingCustomer = await User.findById(mu_id);
            // Retain the existing image or use the new image
            const customerImage = req.file ? newImage : (existingCustomer ? existingCustomer.image : {});
        
            // Hash the new password if it has been changed
            let customerPasswordHash;
            if (password && password !== existingCustomer.password) {
                customerPasswordHash = bcrypt.hashSync(password, 10);
            } else {
                // If the password hasn't changed, retain the existing hashed password
                customerPasswordHash = existingCustomer.password;
            }
        
            // Update the document with the hashed password
            await User.findByIdAndUpdate(mu_id, {
                $set: {
                    senderName, 
                    senderGender, 
                    senderDob, 
                    senderNumber, 
                    selectMembership, 
                    senderEmail,  
                    username, 
                    senderAddress, 
                    senderCity, 
                    senderState, 
                    postCode, 
                    country,
                    image: customerImage,
                    password: customerPasswordHash, // Update the password only if it has changed
                    admin
                }
            });
             // Your email sending code here
             let msg = `
             <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
             <p>Dear   ${senderName} ,  We hope this message finds you well. </p>

             <p>We wanted to inform you that there has been an update to your information in our database. The details that have been modified include:</p>
            <ul>
                <li>Full Name: ${senderName}</li>
                <li>Membership: ${selectMembership}</li>
                <li>Email Address: ${senderEmail}</li>
               <li>Phone Number: ${senderNumber}</li>
               <li>Username: ${username}</li>
               <li>Home Address: ${senderAddress}</li>
               <li>City: ${senderCity}</li>
               <li>State: ${senderState}</li>
            </ul>

            <p>Please review the changes to ensure that they accurately reflect your information. If you believe any information is incorrect or if you have any questions regarding the update, please don't hesitate to reach out to our administrative team at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you</p>

            <p>We value your continued association with us, and it's important to us that your records are kept up-to-date for your convenience and our records.</p>

            <p>Thank you for your prompt attention to this matter. We appreciate your trust in our services and are here to assist you with any further inquiries you may have/p>

            <p>Best regards,<br>
            The Korex Logistic Team</p>`;

            const mailOptions = {
                from: process.env.NODEMAILER_EMAIL,
                to: senderEmail,
                subject: 'Information Update Confirmation!',
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
            res.redirect('/admin/allRegisteredUser');
        } catch (error) {
            console.error('Error updating admin:', error);
            req.flash('error_msg', 'An error occurred while updating user information.');
            res.redirect('/admin/allRegisteredUser'); 
        }
};

const deleteUser = (req, res) => {
    const mu_id = req.params.mu_id;
    User.findByIdAndDelete(mu_id)
    .then(() => {
        req.flash(`success_msg`, 'User deleted successfully');
        res.redirect(`/admin/allRegisteredUser`)
    })
    .catch((error) => {
        console.error('Error deleting admin:', error);
        req.flash('error_msg', 'Error deleting admin');
        res.redirect('/admin/dashboard');
    })

};

const createNewLabel =  (req, res) => {
    const admin = req.user;
    const newTrackingID = generateTrackingID();
    res.render('admin/createNewLabel', {admin, newTrackingID});
};

const createNewLabelPost = async (req, res) => {

    const { senderName, senderEmail, senderNumber, selectMembership, senderAddress, senderCity, senderState, shippingMethod, recipientName, recipientEmail, recipientNumber, recipientAddress, recipientCity, recipientState,shippingAmount, trackingID } = req.body;
    const admin = req.user;
    const userId = req.session.user_id;
    let errors = [];

    if (!senderName || !senderEmail || !senderNumber || !selectMembership || !senderAddress || !senderCity || !senderState || !shippingMethod || !recipientName || !recipientEmail || !recipientNumber || !recipientAddress || !recipientCity || !recipientState || !shippingAmount) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    if (errors.length > 0) {
        return res.render('admin/createNewLabel', {
            errors,
            senderName,
            senderEmail,
            senderNumber,
            selectMembership,
            senderAddress,
            senderCity,
            senderState,
            shippingMethod,
            recipientName,
            recipientEmail,
            recipientNumber,
            recipientAddress,
            recipientCity,
            recipientState,
            shippingAmount,
            admin,
        });
    }
 
  
    try {

      let newTrackingID = trackingID;
      const existingShippingLabel = await shippingLabel.findOne({ trackingID });
      if (existingShippingLabel) { 
          newTrackingID = await generateTrackingID(); // Generate a new tracking number
      }

       // Fetch the payment details from the database
       const payment = await Payment.findOne({ userId }).sort({ date_added: -1 });
       if (!payment) {
           throw new Error('Payment details not found');
       }
       console.log('Payment retrieved:', payment);

  
        const newShippingLabel = new shippingLabel({
            senderName,
            senderEmail,
            senderNumber,
            selectMembership,
            senderAddress,
            senderCity,
            senderState,
            shippingMethod,
            recipientName,
            recipientEmail,
            recipientNumber,
            recipientAddress,
            recipientCity,
            recipientState,
            shippingAmount,
            trackingID: newTrackingID,
            statusMessage: 'Unknown Status, check back later', // Set initial status here
            paymentId: payment._id,// Link the payment to the shipping label
        });

        await newShippingLabel.save();
        // console.log(newShippingLabel.save())
        
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
            <li>Shipping Amount: ${shippingAmount}</li>
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

        <p>If you have any questions or need assistance, feel free to reach out to our support team at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you.</p>

        <p>Best regards,<br>
        The Korex Logistic Team</p>`;

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
               res.status(200).redirect('/admin/labelHistory');
           }, 5000); 
    } catch (error) {
        console.error('Error creating shipping label:', error);
         res.status(500).json({ success: false, error: 'An error occurred while processing your request.' });
    }
};

const searchWithTrackingId = async (req, res) => {
    try {
        const admin = req.user;
        const userTrackingId = req.body.trackingID;

        const query = {
            trackingID: { $regex: new RegExp(userTrackingId, 'i') }
        };

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const ShippingHistory = await shippingLabel.find(query)
            .sort({ date_added: -1 }); // Sort by date_added in descending order

        const totalShippingLabels = ShippingHistory.length;
        const totalPages = Math.ceil(totalShippingLabels / limit);
        const myShippingHistory = ShippingHistory.slice(skip, skip + limit);

        res.render('admin/searchWithTrackingId', { admin, myShippingHistory, currentPage: page, totalPages });
    } catch (err) {
        console.error(err);
        res.redirect('admin/labelHistory');
    }
};

const shippingLabelHistory = async (req, res) => {
    const admin = req.user;
    //setting my pagination
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;  // Number of items per page
    const totalPosts = await shippingLabel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);
     // Fetch payment details based on the shippingLabelId
    const myShippingHistory = await shippingLabel.find()
    .sort({ date_added: -1 }) // Sort by date_added in descending order
    .skip((page - 1) * perPage)
    .limit(perPage)
    .populate('paymentId'); // Populate the 'payment' field

      res.render('admin/labelHistory', { admin, myShippingHistory, currentPage: page, totalPages });
};

const viewLabelInformation = async (req, res) => {

    try {
        const admin = req.user; 
        const profileId = req.params.mu_id;
           // Fetch shippingLabel details based on the shippingLabelId
         const labelInfo = await shippingLabel.findOne({ _id: profileId }).populate('paymentId');
        
         if (!labelInfo) {
            return res.status(404).send(`Label information not found`);
        }
        res.render(`admin/viewLabelInfo`, { labelInfo, admin });
    } catch (err) {
        console.error(err);
        res.status(500).send(`There's a problem selecting from DB`);
    }
};

const editLabelHistory = (req, res) => {
    const admin = req.user;
    const mv = shippingLabel.findOne({ _id: req.params.mu_id })
    .then((recs) => {
        res.render(`admin/editLabel`, { editLabelInfo: recs, admin })
    })
    .catch((err) => {
        res.send(`There's a problem selecting from DB`);
        console.log(err);
    })

};

const editLabelHistoryPost = async (req, res) => {
    try {
        const mu_id = req.params.mu_id;
        const admin = req.body;
        const { senderName, senderEmail, senderNumber, senderAddress,senderCity,senderState, recipientName, recipientEmail, recipientNumber, recipientAddress,recipientCity,recipientState, deliveryDay, deliveryDate, deliveryMonth,deliveryYear, deliveryTime,statusCode } = req.body;
        
        //These lines are extracting specific properties from req.body to be 
        //passed as arguments to the generateStatusMessage function.
        // Generate the status message based on the selected statusCode
        const statusMessage = generateStatusMessage(statusCode, {
            deliveryTime,
            deliveryDay,
            deliveryDate,
            deliveryYear,
            recipientCity,
            recipientState,
            customerSupportContact:phoneNumber
        });
    
        
         // Update the document with the hashed password
        await shippingLabel.findByIdAndUpdate(mu_id, {
            $set: { senderName, senderEmail, senderNumber,  senderAddress,senderCity,senderState,recipientName, 
                recipientEmail, recipientNumber, recipientAddress, recipientCity,recipientState, deliveryDay,
                deliveryDate, deliveryMonth,deliveryYear, deliveryTime, statusMessage, customerSupportContact:phoneNumber,admin,
            }
        });

        let msg = `
        <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
        <p>Dear   ${senderName} ,   We wanted to inform you that there has been an update to your information in our database.</p>
        <p>The details that have been modified include:. </p>

        <p>New Information:</p>
        <ul>
            <li>Sender Name: ${senderName}</li>
            <li>Sender Email: ${senderEmail}</li>
            <li>Sender Number: ${senderNumber}</li>
            <li>Sender Address: ${senderAddress}</li>
            <li>Recipient Name: ${recipientName}</li>
            <li>Recipient Email: ${recipientEmail}</li>
            <li>Recipient Number: ${recipientNumber}</li>
            <li>Recipient Address : ${recipientAddress}</li>
            <li>Delivery Day: ${deliveryDay}</li>
            <li>Delivery Date: ${deliveryDate}</li>
            <li>DeliveryMonth: ${deliveryMonth}</li>
            <li>DeliveryMonth: ${deliveryYear}</li>
            <li>Delivery Time: ${deliveryTime}</li>
            <li>Status Message: ${statusMessage}</li>
            
        </ul>

        <p>Please review the changes to ensure that they accurately reflect your information. If you believe any information is incorrect or if you have any questions regarding the update, please don't hesitate to reach out to our administrative team at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you.</p>

        <p>We value your continued association with us, and it's important to us that your records are kept up-to-date for your convenience and our records.</p>

        <p>Thank you for your prompt attention to this matter. We appreciate your trust in our services and are here to assist you with any further inquiries you may have..</p>

        <p>Best regards,<br> The Korex Logistic Team </p>`;

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: senderEmail,
            subject: 'Shipping Update Confirmation',
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
        res.redirect('/admin/labelHistory');
    } catch (error) {
        console.error('Error updating admin:', error);
        req.flash('error_msg', 'An error occurred while updating admin information.');
        res.redirect('/admin/dashboard'); 
    }

};

const deleteShipping = (req, res) => {
    const mu_id = req.params.mu_id;
    shippingLabel.findByIdAndDelete(mu_id)
    .then(() => {
        req.flash(`success_msg`, 'Label deleted successfully');
        res.redirect(`/admin/labelHistory`)
    })
    .catch((error) => {
        console.error('Error deleting admin:', error);
        req.flash('error_msg', 'Error deleting admin');
        res.redirect('/admin/dashboard');
    })

};

const addKorexStaff = async (req, res) => {
    const admin = req.user; // Access the authenticated admin user
    res.render('admin/korexStaff', {  admin}); 

};

//Staff IMAGE FOLDER
let storge = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/staffImage/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '_' + Date.now())
    }
});

const upl = multer({ storage: storge });

const korexStaffPost = async (req, res) => {

    const { staffName, staffDob, staffEmail, staffNumber, staffPosition, staffAddress, staffCity, 
        staffState, staffEmergencyName, staffEmergencyNumber, staffEmployDate, } = req.body;

    let errors = [];
    const admin = req.user;

    if ( !staffName || !staffDob || !staffEmail || !staffNumber || !staffPosition || !staffAddress || !staffCity || !staffState || !staffEmergencyName || !staffEmergencyNumber || !staffEmployDate ) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    try {

        const adminWithEmail = await Admin.findOne({ adminEmail: staffEmail });
        if (adminWithEmail) {
            errors.push({ msg: 'Email already registered' });
        }

        const userWithEmail = await User.findOne({ senderEmail: staffEmail });
        if (userWithEmail) {
            errors.push({ msg: 'Email already registered' });
        }

        const staffWithEmail = await Staff.findOne({ staffEmail: staffEmail });
        if (staffWithEmail) {
            errors.push({ msg: 'Email already registered' });
        }


        if (errors.length > 0) {
            return res.render('admin/korexStaff', {
                errors,staffName,staffDob, staffEmail,
                staffNumber, staffPosition, staffAddress, 
                staffCity, staffState, staffEmergencyName, 
                staffEmergencyNumber,staffEmployDate, admin
            });
        }

        const newStaff = new Staff({   
            staffName, 
            staffDob, 
            staffEmail, 
            staffNumber, 
            staffPosition, 
            staffAddress, 
            staffCity, 
            staffState, 
            staffEmergencyName, 
            staffEmergencyNumber, 
            staffEmployDate, 
            image: {
                data: fs.readFileSync(path.join(__dirname, '../public/staffImage/' + req.file.filename)),
                contentType: 'image/png',
            },
            admin,
        
        });

        await newStaff.save();

        // Your email sending code here
        let msg = `
        <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
        <p>Dear   ${staffName} ,  We are thrilled to welcome you to Korex Logistic Service. </p>

        <p>Here are some important details to get you started:</p>
        <ul>
            <li>Full Name: ${staffName}</li>
            <li>Date Of Birth: ${staffDob}</li>
            <li>Email Address: ${staffEmail}</li>
            <li>Contact No: ${staffNumber}</li>
            <li>Position: ${staffPosition}</li>
            <li>Home Address: ${staffAddress}</li>
            <li>City: ${staffCity}</li>
            <li>State: ${staffState}</li>
            <li>Emergency Name: ${staffEmergencyName}</li>
            <li>Emergency Number: ${staffEmergencyNumber}</li>
            <li>Employment Date: ${staffEmployDate}</li>
        </ul>

        <p>Thank you for joining Korex Logistic Company! We are delighted to welcome you to our platform</p>
        <p>If you have any questions or need assistance, feel free to reach out to our support team at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you</p>

        <p>Best regards,<br>
        The Korex Logistic Team</p>`;

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: staffEmail,
            subject: 'Welcome to Korex Logistic Company!',
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

       req.flash('message', "Registration Successful.");
        res.redirect('/admin/allKorexStaff');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while processing your request.');
        res.redirect('/admin/dashboard');
    }

};

const allKorexStaff = async (req, res) => {

    const admin = req.user; // Access the authenticated admin user
    const page = parseInt(req.query.page) || 1;
    const limit = 10; 
    const skip = (page - 1) * limit;
  
    const companyStaff = await Staff.find()
    .sort({ date_added: -1 }); // Sort by date_added in descending order
  
    const totalcompanyStaff = companyStaff.length;
    const totalPages = Math.ceil(totalcompanyStaff / limit);
  
    const myCompanyStaff = companyStaff.slice(skip, skip + limit);
    res.render('admin/allKorexStaff', {  admin, myCompanyStaff,  currentPage: page, totalPages}); 

};

const searchStaffResult = async (req, res) => {
    try {
        const admin = req.user;
        const korexStaffName = req.body.staffName;
        console.log(req.body.staffName)

        const query = {
            staffName: { $regex: new RegExp(korexStaffName, 'i') }
        };

        const page = parseInt(req.query.page) || 1;
        const limit = 10; 
        const skip = (page - 1) * limit;
      
        const companyStaff = await Staff.find(query)
        .sort({ date_added: -1 }); // Sort by date_added in descending order
      
        const totalcompanyStaff = companyStaff.length;
        const totalPages = Math.ceil(totalcompanyStaff / limit);
      
        const korexStaffs = companyStaff.slice(skip, skip + limit);
        res.render('admin/searchStaffResult', {  admin, korexStaffs,  currentPage: page, totalPages}); 
    } catch (err) {
        console.error(err);
        res.redirect('admin/allKorexStaff');
    }
};

const staffProfile = async (req, res) => {
    try {
        const profileId = req.params.mu_id;
        
        // Fetch patient appointment details based on the appointmentId
        const staffInfo = await Staff.findOne({ _id: profileId });
        
        if (!staffInfo) {
            return res.status(404).send(`Admin information not found`);
        }
        const admin = req.user; 
        
         // Render the viewAppoint page with appointment details
         res.render(`admin/staffProfile`, { staffInfo, admin });
        } catch (err) {
            console.error(err);
            res.status(500).send(`There's a problem selecting from DB`);
        }
};

const editMyStaff = (req, res) => {
    const admin = req.user;
    const mv = Staff.findOne({ _id: req.params.mu_id })
    .then((recs) => {
        res.render(`admin/editStaff`, { editMyStaff: recs, admin })
    })
    .catch((err) => {
        res.send(`There's a problem selecting from DB`);
        console.log(err);
    })

};

const editStaffProfilePost = async (req, res) => {
    try {
        const mu_id = req.params.mu_id;
        const admin = req.body;
       
    const { staffName, staffDob, staffEmail, staffNumber, staffPosition, staffAddress, staffCity, 
        staffState, staffEmergencyName, staffEmergencyNumber, } = req.body;
          
        
            // Update the document with the hashed password
            await Staff.findByIdAndUpdate(mu_id, {
                $set: {
                    staffName, 
                    staffDob, 
                    staffEmail, 
                    staffNumber, 
                    staffPosition, 
                    staffAddress,  
                    staffCity, 
                    staffState, 
                    staffEmergencyName, 
                    staffEmergencyNumber, 
                    admin
                }
            });
             // Your email sending code here
             let msg = `
             <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
             <p>Dear   ${staffName} ,  We hope this message finds you well. </p>

             <p>We wanted to inform you that there has been an update to your information in our database. The details that have been modified include:</p>
            <ul>
                <li>Full Name: ${staffName}</li>
                <li>Date Of Birth: ${staffDob}</li>
                <li>Email Address: ${staffEmail}</li>
               <li>Phone Number: ${staffNumber}</li>
               <li>Position: ${staffPosition}</li>
               <li>Home Address: ${staffAddress}</li>
               <li>City: ${staffCity}</li>
               <li>State: ${staffState}</li>
               <li>Emergency Name: ${staffEmergencyName}</li>
               <li>Emergency Number: ${staffEmergencyNumber}</li>
            </ul>

            <p>Please review the changes to ensure that they accurately reflect your information. If you believe any information is incorrect or if you have any questions regarding the update, please don't hesitate to reach out to our administrative team at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you.</p>

            <p>We value your continued association with us, and it's important to us that your records are kept up-to-date for your convenience and our records.</p>

            <p>Thank you for your prompt attention to this matter. We appreciate your trust in our services and are here to assist you with any further inquiries you may have/p>

            <p>Best regards,<br>
            The Korex Logistic Team</p>`;

            const mailOptions = {
                from: process.env.NODEMAILER_EMAIL,
                to: staffEmail,
                subject: 'Information Update Confirmation!',
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
            req.flash('success_msg', 'Dear ' + staffName + ', Your Information Successfully Updated');
            res.redirect('/admin/allKorexStaff');
        } catch (error) {
            console.error('Error updating admin:', error);
            req.flash('error_msg', 'An error occurred while updating user information.');
            res.redirect('/admin/dashboard'); 
        }

};

const deleteStaff = (req, res) => {
    const mu_id = req.params.mu_id;
    Staff.findByIdAndDelete(mu_id)
    .then(() => {
        req.flash(`success_msg`, 'Staff deleted successfully');
        res.redirect(`/admin/allKorexStaff`)
    })
    .catch((error) => {
        console.error('Error deleting admin:', error);
        req.flash('error_msg', 'Error deleting admin');
        res.redirect('/admin/dashboard');
    })

};

const staffPayment = async (req, res) =>{
    try {
        // pupulatiin the Staff name, speciality and email
        const staffs = await Staff.find({}, 'staffName staffEmail staffPosition staffNumber');
        const admin = req.user;

        const page = parseInt(req.query.page) || 1;
        const perPage = 10; // Number of items per page
        const totalPosts = await StaffPayment.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        const staffPayment = await StaffPayment.find()
            .sort({ date_added: -1 }) // Sort by date_added in descending order
            .skip((page - 1) * perPage)
            .limit(perPage);

        res.render('admin/staffPayment', { staffPayment,admin, staffs, totalPages, currentPage: page });
    } catch (err) {
        console.error(err);
        // Handle any errors
        res.status(500).send('Internal Server Error');
    }

};

const staffPaymentPost = async (req, res) =>{

    const{staffName, staffEmail, staffPosition,staffNumber, paymentPurpose, totalAmount, paymentMethod, paymentStatus, paymentDate}= req.body;
    const admin = req.user;
  
    if (!staffName || !staffEmail || !staffPosition || !staffNumber || !paymentPurpose || !totalAmount || !paymentMethod  || !paymentStatus || !paymentDate) {
        req.flash(`error`, `Please fill all fields`);
        res.redirect(`/admin/staffPayment`);
    } 

        const newStaffPayment= new StaffPayment({
            staffName,
            staffEmail,
            staffPosition,
            staffNumber,
            paymentPurpose,
            totalAmount,
            paymentMethod,
            paymentStatus,
            paymentDate,
            admin
        });

        //TO SAVE INTO DATABASE INPUT
        try {
            newStaffPayment.save();

            let msg = `
            <p><img src="cid:shipping" alt="shipping" style="width: 100%; max-width: 600px; height: auto;"/></p><br>
            <p>Dear ${staffName}, we are pleased to inform you that ${paymentPurpose} payment has been made to you on ${paymentDate} successfully. We greatly appreciate your hard work and dedication to Korex Logistic.</p>

            <p>Payment Details:</p>
            <ul>
                <li>Full Name: ${staffName}</li>
                <li>Amount: ${totalAmount}</li>
                <li>Payment Date: ${paymentDate}</li>
                <li>Payment Method: ${paymentMethod}</li>
                <li>Payment Purpose: ${paymentPurpose}</li>
                <li>Payment Status: ${paymentStatus}</li>
                <li>Staff Email: ${staffEmail}</li>
                <li>Staff Number: ${staffNumber}</li>
                
            </ul>

            <p>If you have any questions or concerns regarding your payment or need further assistance, please don't hesitate to contact our Human Resources department at <a href="tel:${phoneNumber}">${phoneNumber}</a> or <a href="mailto:${emailAddress}">${emailAddress}</a>. Your satisfaction is important to us, and we are here to assist you</p>

            <p>Thank you for your continued commitment to Korex logistic, and we look forward to your continued contributions in the future.</p>

            <p>Best regards,<br>
            The Korex Logistic Team</p>`;

            const mailOptions = {
                from: process.env.NODEMAILER_EMAIL,
                to: staffEmail,
                subject: 'Payment Confirmation',
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
            
            req.flash('success_msg', staffName + ' Payment Successful');
            res.redirect('/admin/staffPayment');
        } catch (err) {
            console.log(err);
            req.flash('error', 'An error occurred while making your Payment');
            res.redirect('/admin/staffPayment');

        }
};

const searchStaffPayment = async (req, res) => {
    try {
        const admin = req.user;
        const korexStaffName = req.body.staffName;
        console.log(req.body.staffName)

        const query = {
            staffName: { $regex: new RegExp(korexStaffName, 'i') }
        };

        const page = parseInt(req.query.page) || 1;
        const limit = 10; 
        const skip = (page - 1) * limit;
      
        const companyStaff = await StaffPayment.find(query)
        .sort({ date_added: -1 }); // Sort by date_added in descending order
      
        const totalcompanyStaff = companyStaff.length;
        const totalPages = Math.ceil(totalcompanyStaff / limit);
      
        const payment = companyStaff.slice(skip, skip + limit);
        res.render('admin/searchStaffPayment', {  admin, payment,  currentPage: page, totalPages}); 
    } catch (err) {
        console.error(err);
        res.redirect('admin/staffPayment');
    }
};

const deletePayment = (req, res) => {
    const mu_id = req.params.mu_id;
    StaffPayment.findByIdAndDelete(mu_id)
    .then(() => {
        req.flash(`success_msg`, 'Staff deleted successfully');
        res.redirect(`/admin/staffPayment`)
    })
    .catch((error) => {
        console.error('Error deleting admin:', error);
        req.flash('error_msg', 'Error deleting admin');
        res.redirect('/admin/dashboard');
    })

};

const companyExpenses = async (req, res) => {
    try {
        const admin = req.user;

        const page = parseInt(req.query.page) || 1;
        const perPage = 10; // Number of items per page
        const totalPosts = await CompanyExpenses.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        const expenses = await CompanyExpenses.find()
            .sort({ date_added: -1 }) // Sort by date_added in descending order
            .skip((page - 1) * perPage)
            .limit(perPage);

        res.render('admin/companyExpenses', { expenses,admin, totalPages, currentPage: page });
    } catch (err) {
        console.error(err);
        // Handle any errors
        res.status(500).send('Internal Server Error');
    }

};


let stoge = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/expensesReceipt/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '_' + Date.now())
    }
});

const upld = multer({ storage: stoge });

const companyExpensesPost = async (req, res) => {
    const admin = req.user;
    const { expenseType, expenseAmount, expenseVendor, expenseAuthorizedBy, paymentMethod, paymentStatus, expenseDate } = req.body;

    if (!expenseType || !expenseAmount || !expenseVendor || !expenseAuthorizedBy || !paymentMethod || !paymentStatus || !expenseDate) {
        req.flash('error', 'Please fill all fields');
        return res.redirect('/admin/companyExpenses');
    }

    const newCompanyExpenses = new CompanyExpenses({
        expenseType,
        expenseAmount,
        expenseVendor,
        expenseAuthorizedBy,
        paymentMethod,
        paymentStatus,
        expenseDate,
        image: {
            data: fs.readFileSync(path.join(__dirname, '../public/expensesReceipt/' + req.file.filename)),
            contentType: 'image/png'
        },
        admin
    });

    try {
        await newCompanyExpenses.save();
        req.flash('success_msg', `${expenseType} Expense added successfully`);
        res.redirect('/admin/companyExpenses');
    } catch (err) {
        console.log(err);
        req.flash('error', 'An error occurred while adding the expense');
        res.redirect('/admin/dashboard');
    }
};

const searchcompanyExpenses = async (req, res) => {
    try {
        const admin = req.user;
        const ExpensesMade = req.body.expenseType;

        const query = {
            expenseType: { $regex: new RegExp(ExpensesMade, 'i') }
        };

        const page = parseInt(req.query.page) || 1;
        const limit = 10; 
        const skip = (page - 1) * limit;
      
        const companyExpensesMade = await CompanyExpenses.find(query)
        .sort({ date_added: -1 }); // Sort by date_added in descending order
      
        const totalcompanyExpensesMade = companyExpensesMade.length;
        const totalPages = Math.ceil(totalcompanyExpensesMade / limit);
      
        const companyExpense = companyExpensesMade.slice(skip, skip + limit);
        res.render('admin/searchExpenses', {  admin, companyExpense,  currentPage: page, totalPages}); 
    } catch (err) {
        console.error(err);
        res.redirect('admin/companyExpenses');
    }
};


const contactAdmin = async (req, res) => {
    try {
        const admin = req.user;
        // Fetch users from the database (modify this part based on your actual user fetching logic)
        const users = await User.find();
        res.render('admin/contactAdmin', { users, admin});
    } catch (error) {
        console.error('Error fetching users:', error);
        // Handle the error appropriately
        res.status(500).send('Internal Server Error');
    }
};


// Admin logout
const adminLogout = (req, res, io) => {
    // Perform logout logic (e.g., destroy the session)
    req.logout((err) => {
        if (err) {
            console.error('Error during logout:', err);
        }
        res.redirect('/admin/welcomeAdmin');
    });
};


//STAFF API END POINT 
const staffApi = async (req, res) => {
    try {
            // Retrieve the list of staff from your database using await
        const staffs = await Staff.find({}, 'staffName staffEmail staffPosition staffNumber');
         // Send the list of doctors as JSON
        res.json(staffs);
      } catch (error) {
        console.error("Error fetching staffs data:", error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
};
    
//CHATTING ENDPOINT
const userAndAdminChat = async (req, res) => {
        try {
            // Fetch all chat messages from the database
            const chatMessages = await Chat.find().sort({ date_added: 'asc' });
        
            // Send the chat messages as JSON
            res.json(chatMessages);
          } catch (error) {
            console.error('Error fetching chat messages:', error);
            res.status(500).send('Internal Server Error');
          }
};
    
 // Route to handle new chat messages
const userAndAdminChatPost = async (req, res) => {
        try {
            // Assuming the client sends the message in the request body
            const { message, sender,senderRole } = req.body;
            // Save the new chat message to the database
            const newChatMessage = new Chat({
              message,
              senderName:sender,
              senderRole,
              date_added: new Date()
            });
            await newChatMessage.save();
            // Send a success response
            res.status(201).send('Message sent successfully');
          } catch (error) {
            console.error('Error sending chat message:', error);
            res.status(500).send('Internal Server Error');
          }
};
    
//New endpoint to fetch messages specific to each room
const chatRooms = async (req, res) => {
        const room = req.params.room;
        try {
             const messages = await Chat.find({ room }).sort({ date_added: 'asc' });
            
            res.json(messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).send('Internal Server Error');
        }
};

//CALCULATING SHIPMENT FEES
const shippingAmounts = (req, res) => {

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

const makePayment = async (req, res) => {
    try {
        const { name, email, amount } = req.body;

        const params = JSON.stringify({
            name,
            email,
            amount: amount * 100,
        });

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

        const clientReq = https.request(options, async apiRes => {
            let data = '';
            apiRes.on('data', (chunk) => {
                data += chunk;
            });
            apiRes.on('end', async () => {
                try {
                    const responseData = JSON.parse(data);

                    // Save payment details to the database
                    const payment = new Payment({
                        name,
                        email,
                        amount,
                        reference: responseData.data.reference,
                        userId: req.session.user_id
                    });
                    await payment.save();
                    // console.log('Payment saved:', payment);
                    // Send the authorization URL back to the client
                    res.json(responseData);
               
                } catch (error) {
                    console.error('Error processing payment response:', error);
                    res.status(500).json({ error: 'An error occurred while processing payment response' });
                }
            });
        }).on('error', error => {
            console.error('Payment request error:', error);
            res.status(400).json({ error: 'Failed to initialize payment' });
        });

        clientReq.write(params);
        clientReq.end();

    } catch (error) {
        console.error('Error making payment:', error);
        res.status(500).json({ error: 'An error occurred while making payment' });
    }
};


const verifyPayment = async (req, res) => {
    try {
        const reference = req.params.reference; // Extract reference from URL parameter
        console.log(reference);
        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: `/transaction/verify/${encodeURIComponent(reference)}`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
            }
        };

        const apiReq = https.request(options, apiRes => {
            let data = '';
            apiRes.on('data', (chunk) => {
                data += chunk;
            });
            apiRes.on('end', async () => {
                try {
                    const responseData = JSON.parse(data);
                    if (responseData.status && responseData.data.status === 'success') {
                       // Payment is successful, update payment status in the database
                        await Payment.findOneAndUpdate({ reference }, { $set: { status: 'success' } });
                        console.log('Payment verified successfully');
                        res.json({ success: true, message: 'Payment verified successfully' });
                    } else {
                          // Payment verification failed
                        console.log('Payment verification failed');
                        res.json({ success: false, message: 'Payment verification failed' });
                    }
                } catch (error) {
                    console.error('Error parsing payment verification response:', error);
                    res.status(500).json({ error: 'An error occurred while verifying payment' });
                }
            });
        }).on('error', error => {
            console.error('Payment verification request error:', error);
            res.status(400).json({ error: 'Failed to verify payment' });
        });

        apiReq.end();

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'An error occurred while verifying payment' });
    }
};




module.exports = ({ adminloginPage, adminloginPagePost, adminDashboard, newNotification,deleteNotification, addAdmin, uploads, addAdminPost, viewAllAdmin, adminProfilePage, editAdminPage, editAdminPagePost, deleteAdmin, addNewUser, upload, addNewUserPost, registeredUser,searchUsers, userProfile, editUserProfile, editUserProfilePost, deleteUser, createNewLabel, createNewLabelPost, searchWithTrackingId, shippingLabelHistory, viewLabelInformation, editLabelHistory, editLabelHistoryPost, deleteShipping, addKorexStaff, upl, korexStaffPost, allKorexStaff, searchStaffResult, staffProfile, editMyStaff, editStaffProfilePost, deleteStaff, staffPayment, staffPaymentPost, searchStaffPayment, deletePayment, companyExpenses, upld, companyExpensesPost, searchcompanyExpenses, contactAdmin, adminLogout,staffApi, userAndAdminChat, userAndAdminChatPost,chatRooms, shippingAmounts,makePayment,verifyPayment
});


