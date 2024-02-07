const express = require('express');
const router = express.Router();
const {checkAuthenticated, checkNotAuthenticated} = require ('../middleware/authentication');

const { registrationPage, upload, registrationPagePost,verifyEmail,resendVerificationEmail, forgetPasswordPage, forgetPasswordPost, resetPasswordPage, resetPasswordPost, verificationFailed,verificationExpired, loginPage, loginPost } = require('../controller/loginController');


// Authentication routes
router.get('/register', checkNotAuthenticated, registrationPage);
router.post('/registerPost', checkNotAuthenticated, upload.single('image'), registrationPagePost);
router.get('/login', checkNotAuthenticated, loginPage);
router.post('/loginPost', checkNotAuthenticated, loginPost);

// Password reset routes
router.get('/forgetPassword', checkNotAuthenticated, forgetPasswordPage);
router.post('/forgetPasswordPost', checkNotAuthenticated, forgetPasswordPost);
router.get('/resetPassword/:id/:token', checkNotAuthenticated, resetPasswordPage);
router.post('/resetPasswordPost', checkNotAuthenticated, resetPasswordPost);

// Email verification routes
router.get('/verify-email/:id/:token', checkNotAuthenticated, verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.get('/verification-failed', checkNotAuthenticated, verificationFailed);
router.get('/verification-expired', checkNotAuthenticated, verificationExpired);







module.exports = router;
