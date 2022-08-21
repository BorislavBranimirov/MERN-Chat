const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
    },
    sender: { type: String, required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);
