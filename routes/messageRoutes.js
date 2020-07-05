const express = require('express');
const router = express.Router();

const messageController = require('../controllers/messageController');
const { verifyAccessToken } = require('../controllers/authController');

router.route('/:id')
    .get(verifyAccessToken, messageController.getOneById)
    .patch(verifyAccessToken, messageController.changeOneById)
    .delete(verifyAccessToken, messageController.deleteOneById);

module.exports = router;