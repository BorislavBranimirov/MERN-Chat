const express = require('express');
const router = express.Router();

const chatRoomController = require('../controllers/chatRoomController');
const messageController = require('../controllers/messageController');
const { verifyAccessToken } = require('../controllers/authController');

router.route('/')
    .get(verifyAccessToken, chatRoomController.getAll)
    .post(verifyAccessToken, chatRoomController.createOne);

router.route('/search')
    .post(verifyAccessToken, chatRoomController.getAllBySearch);

router.route('/:id')
    .get(verifyAccessToken, chatRoomController.getOneById)
    .patch(verifyAccessToken, chatRoomController.changeOneById)
    .delete(verifyAccessToken, chatRoomController.deleteOneById);

router.route('/:id/login')
    .post(verifyAccessToken, chatRoomController.chatRoomLogin);

router.route('/:id/logout')
    .post(verifyAccessToken, chatRoomController.chatRoomLogout);

router.route('/:id/messages')
    .get(verifyAccessToken, messageController.getAllByChatRoom)
    .post(verifyAccessToken, messageController.createOne);

module.exports = router;