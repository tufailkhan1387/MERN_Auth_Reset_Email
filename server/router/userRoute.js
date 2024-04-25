import express from 'express';
const router = express.Router(); // Use express.Router() instead of express()
import Auth from '../middleware/auth.js';
import * as userController from "../controllers/userController.js";

// 1. Creating a new User
router.route('/register').post(userController.registerUser);
router.route('/login').post(userController.signInUser);
router.route('/verifyemail').post(userController.verifyemail);
router.route('/resendotp').post(userController.resendotp);
router.route('/forgetpasswordrequest').post(userController.forgetpasswordrequest);
router.route('/logout').post(Auth, userController.logout); // is use to update the user profile
router.route('/session').get(Auth, userController.session); // is use to update the user profile
router.route('/addresslabels').get( userController.addresslabels); // is use to update the user profile

export default router;
