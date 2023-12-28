const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/:username/isUsernameFound').get(authController.isUsernameFound);

router.route('/:email/isEmailFound').get(authController.isEmailFound);

module.exports = router;
