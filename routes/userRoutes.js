const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const chatRoomController = require('../controllers/chatRoomController');
const { verifyAccessToken } = require('../controllers/authController');

router
  .route('/')
  .get(verifyAccessToken, userController.getAll)
  .post(userController.createOne);

router
  .route('/:username')
  .get(verifyAccessToken, userController.getOneByName)
  .patch(verifyAccessToken, userController.changeOneByName)
  .delete(verifyAccessToken, userController.deleteOneByName);

router
  .route('/:username/chatrooms')
  .get(verifyAccessToken, chatRoomController.getAllByUser);

module.exports = router;
