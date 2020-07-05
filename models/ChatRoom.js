const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ChatRoomSchema = mongoose.Schema({
    name: { type: String, required: true, unique: true },
    password: { type: String, default: '' },
    admin: { type: String, required: true }
}, {
    timestamps: true
});

ChatRoomSchema.pre('save', async function (next) {
    try {
        // if user is being saved but password remains unchanged, or if there is no password, don't hash again
        if (!this.isModified('password') || this.password === '') {
            return next();
        }

        this.password = await bcrypt.hash(this.password, 12);
        return next();
    } catch (err) {
        return next(err);
    }
});

ChatRoomSchema.methods.comparePassword = async function (password) {
    // make bcrypt.compare work with empty password
    if (password === '' && this.password === '') {
        return true;
    }

    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('ChatRoom', ChatRoomSchema);