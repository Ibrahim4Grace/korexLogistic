const express = require('express');
const router = express.Router();
const {checkAuthenticated, checkNotAuthenticated} = require ('../middleware/authentication');


const { adminloginPage, adminloginPagePost, adminDashboard, newNotification, deleteNotification, addAdmin, uploads, addAdminPost, viewAllAdmin, adminProfilePage,  editAdminPage, editAdminPagePost, deleteAdmin, addNewUser, upload, addNewUserPost, registeredUser,searchUsers, userProfile, editUserProfile, editUserProfilePost, deleteUser, createNewLabel, createNewLabelPost, searchWithTrackingId, shippingLabelHistory, viewLabelInformation, editLabelHistory, editLabelHistoryPost, deleteShipping, addKorexStaff, upl, korexStaffPost, allKorexStaff,searchStaffResult, staffProfile, editMyStaff, editStaffProfilePost, deleteStaff, staffPayment, staffPaymentPost, searchStaffPayment, deletePayment, companyExpenses, upld, companyExpensesPost, searchcompanyExpenses, contactAdmin, adminLogout,staffApi, userAndAdminChat,userAndAdminChatPost,chatRooms, shippingAmounts
} = require('../controller/adminController');

router.get('/welcomeAdmin', checkNotAuthenticated, adminloginPage);
router.post('/adminloginPagePost', checkNotAuthenticated, adminloginPagePost);
router.get('/dashboard', checkAuthenticated, adminDashboard);
router.get('/newNotification', checkAuthenticated, newNotification);
router.get('/deleteNotification/:mu_id', checkAuthenticated, deleteNotification);
router.get('/addAdmin', checkAuthenticated, addAdmin);
router.post('/addAdminPost', checkAuthenticated, uploads.single('image'), addAdminPost);
router.get('/allAdmin', checkAuthenticated, viewAllAdmin);
router.get('/adminProfile/:mu_id', checkAuthenticated, adminProfilePage);
router.get('/editAdmin/:mu_id', checkAuthenticated, editAdminPage);
router.post('/editAdminPagePost/:mu_id', checkAuthenticated, uploads.single('image'), editAdminPagePost);
router.get('/deleteAdmin/:mu_id', checkAuthenticated, deleteAdmin);
router.get('/addNewUser', checkAuthenticated, addNewUser);
router.post('/addNewUserPost', checkAuthenticated, upload.single('image'), addNewUserPost);
router.get('/allRegisteredUser', checkAuthenticated, registeredUser);
router.post('/searchUsers', checkAuthenticated, searchUsers);
router.get('/userProfile/:mu_id', checkAuthenticated, userProfile);
router.get('/editUser/:mu_id', checkAuthenticated, editUserProfile);
router.post('/editUserProfilePost/:mu_id', checkAuthenticated, upload.single('image'), editUserProfilePost);
router.get('/deleteUser/:mu_id', checkAuthenticated, deleteUser);
router.get('/createNewLabel', checkAuthenticated, createNewLabel);
router.post('/createNewLabelPost', checkAuthenticated, createNewLabelPost);
router.post('/searchWithTrackingId', checkAuthenticated, searchWithTrackingId);
router.get('/labelHistory', checkAuthenticated, shippingLabelHistory);
router.get('/viewLabelInfo/:mu_id', checkAuthenticated, viewLabelInformation);
router.get('/editLabel/:mu_id', checkAuthenticated, editLabelHistory);
router.post('/editLabelHistoryPost/:mu_id', checkAuthenticated, editLabelHistoryPost);
router.get('/deleteShipping/:mu_id', checkAuthenticated, deleteShipping);
router.get('/korexStaff', checkAuthenticated, addKorexStaff);
router.post('/korexStaffPost', checkAuthenticated, upl.single('image'), korexStaffPost);
router.get('/allKorexStaff', checkAuthenticated, allKorexStaff);
router.post('/searchStaffResult', checkAuthenticated, searchStaffResult);
router.get('/staffProfile/:mu_id', checkAuthenticated, staffProfile);
router.get('/editStaff/:mu_id', checkAuthenticated, editMyStaff);
router.post('/editStaffProfilePost/:mu_id', checkAuthenticated,  editStaffProfilePost);
router.get('/deleteStaff/:mu_id', checkAuthenticated, deleteStaff);
router.get('/staffPayment', checkAuthenticated, staffPayment);
router.post('/staffPaymentPost', checkAuthenticated, staffPaymentPost);
router.post('/searchStaffPayment', checkAuthenticated, searchStaffPayment);
router.get('/deletePayment/:mu_id', checkAuthenticated, deletePayment);
router.get('/companyExpenses', checkAuthenticated, companyExpenses);
router.post('/companyExpensesPost', checkAuthenticated, upld.single('image'), companyExpensesPost);
router.post('/searchcompanyExpenses', checkAuthenticated, searchcompanyExpenses);
router.get('/contactAdmin', checkAuthenticated, contactAdmin);
router.post('/logout', checkAuthenticated, adminLogout);

//API AND JSON RESPONSE
router.get('/api/staffs', checkAuthenticated, staffApi);
router.get('/chats',  userAndAdminChat);
router.post('/chats', userAndAdminChatPost);
router.get('/chats/:room', chatRooms);

//CALCULATING SHIPMENT FEES
router.post('/calculate-shipping-fees', checkAuthenticated, shippingAmounts);

//INTEGRATING PAYSTACK PAYMENT 
// router.post('/acceptpayment', initializePayment.acceptPayment);


module.exports = router;
