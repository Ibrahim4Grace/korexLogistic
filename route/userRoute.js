const express = require('express');
const router = express.Router();

const {checkAuthenticated, checkNotAuthenticated} = require ('../middleware/authentication');

const { usersLandingPage, createShippingLabel, createLabelPagePost, shippingHistory,viewLabelInfo, editUserInformation, upload,  editUserInformationPost, contactUsPage, logout ,shippingAmount,generatePdfShipping, makePayment,verifyPayment } = require('../controller/userController');

router.get('/welcome',checkNotAuthenticated, usersLandingPage);
router.get('/createLabel', checkNotAuthenticated, createShippingLabel);
router.post('/createLabelPagePost', checkNotAuthenticated, createLabelPagePost);
router.get('/shippingHistory', checkNotAuthenticated, shippingHistory);
router.get('/viewUserLabel/:mu_id', checkNotAuthenticated, viewLabelInfo);
router.get('/editInformation', checkNotAuthenticated, editUserInformation);
router.post('/editUserInfoPost/:userId', checkNotAuthenticated, upload.single('image'), editUserInformationPost);
router.get('/contactUs',checkNotAuthenticated,  contactUsPage);
router.get('/logout', logout);

//CALCULATING SHIPMENT FEES
router.post('/calculate-shipping-fee', checkNotAuthenticated, shippingAmount);

//GENERATE PDF FOR SHIPPING LABEL
router.get('/generate-pdf',checkNotAuthenticated,  generatePdfShipping);

//payment 
router.post('/pay', makePayment)

//verify payment 
router.get('/verify-payment/:reference', verifyPayment)


module.exports = router;

