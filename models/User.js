const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// chatRoomList - list of all rooms the user has joined
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    chatRoomList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  try {
    // if user is being saved but password remains unchanged don't hash again
    if (!this.isModified('password')) {
      return next();
    }

    this.password = await bcrypt.hash(this.password, 12);
    return next();
  } catch (err) {
    return next(err);
  }
});

UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
