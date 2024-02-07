const express = require('express');
const router = express.Router();
const {checkAuthenticated, checkNotAuthenticated} = require ('../middleware/authentication');

const { spinner, indexPage, aboutPage, servicePage, trackingPage,trackingPagePost,trackingStatus,trackingNotFound, contactPage, contactPagePost } = require('../controller/pageController');

router.get('/', checkNotAuthenticated, spinner, indexPage);
router.get('/index', checkNotAuthenticated, indexPage);
router.get('/about', checkNotAuthenticated, aboutPage);
router.get('/service', checkNotAuthenticated, servicePage)
router.get('/tracking', checkNotAuthenticated, trackingPage);
router.post('/trackingPagePost', checkNotAuthenticated, trackingPagePost);
router.get('/contact', checkNotAuthenticated, contactPage);
router.post('/contactPagePost', checkNotAuthenticated, contactPagePost);
router.get('/trackingStatus', checkNotAuthenticated, trackingStatus);
router.get('/trackingNotFound', checkNotAuthenticated, trackingNotFound);



module.exports = router;
