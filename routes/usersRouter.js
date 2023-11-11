const express = require('express');
const usersController = require('../controllers/usersController');

const router = express.Router();

router.route('/:username/isUsernameFound').get(usersController.isUsernameFound);

router.route('/:email/isEmailFound').get(usersController.isEmailFound);

module.exports = router;
