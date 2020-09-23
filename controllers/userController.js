const { User, ChatRoom, Message } = require('../models');
const userUtils = require('../utils/userUtils');

exports.getAll = async (req, res) => {
    try {
        const users = await User.find({}, { 'password': 0 });
        return res.json(users);
    } catch (err) {
        return res.status(500).json({ err: 'An error occurred while searching for users' });
    }
};

exports.getOneByName = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }, { 'password': 0 });
        return res.json(user);
    } catch (err) {
        return res.status(500).json({ err: 'An error occurred while searching for user' });
    }
};

exports.createOne = async (req, res) => {
    // both username and password need to be provided
    if (!req.body.username || !req.body.password) {
        return res.status(422).json({ err: 'No username or password provided' });
    }

    if (!userUtils.usernamePatternTest(req.body.username)) {
        return res.status(422).json({ err: 'Invalid username' });
    }
    if (!userUtils.passwordPatternTest(req.body.password)) {
        return res.status(422).json({ err: 'Invalid password' });
    }

    try {
        const userExists = await User.findOne({ username: req.body.username });
        if (userExists) {
            return res.status(500).json({ err: 'User already exists' });
        }

        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        const newUser = await user.save();
        return res.json({
            success: true,
            id: newUser._id,
            username: newUser.username
        });
    } catch (err) {
        return res.status(500).json({ err: 'An error occurred while creating user' });
    }
};

exports.changeOneByName = async (req, res) => {
    // password needs to be provided
    if (!req.body.password) {
        return res.status(422).json({ err: 'No password provided' });
    }

    if (!userUtils.passwordPatternTest(req.body.password)) {
        return res.status(422).json({ err: 'Invalid password' });
    }

    if (req.params.username !== res.locals.user.username) {
        return res.status(401).json({ err: 'Unauthorized to edit this user' });
    }

    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ err: 'User not found' });
        }

        const isMatch = await user.comparePassword(req.body.password)
        if (isMatch) {
            return res.status(422).json({ err: 'No changes from original user password were provided' });
        }

        user.password = req.body.password;

        const patchedUser = await user.save();
        return res.json({
            success: true,
            id: patchedUser._id,
            username: patchedUser.username
        });
    } catch (err) {
        return res.status(500).json({ err: 'An error occurred while updating user' });
    }
};

exports.deleteOneByName = async (req, res) => {
    if (req.params.username !== res.locals.user.username) {
        return res.status(401).json({ err: 'Unauthorized to delete this user' });
    }

    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ err: 'User not found' });
        }

        // delete all messages in chat rooms owned by the user
        const chatRooms = await ChatRoom.find({ admin: req.params.username }, { '_id': 1 }).lean();
        for (const { _id } of chatRooms) {
            const deleteManyMessagesObj = await Message.deleteMany({ chatRoomId: _id });
        }

        // remove chat rooms from users' lists
        const chatRoomIds = chatRooms.map(({ _id }) => _id);
        const updateManyUsersObj = await User.updateMany({}, { $pull: { chatRoomList: { $in: chatRoomIds } } });

        // delete all chat rooms owned by the user
        const deleteManyChatRoomsObj = await ChatRoom.deleteMany({ admin: req.params.username });

        // delete all messages made by the user in other chatrooms
        const deleteManyOwnMessagesObj = await Message.deleteMany({ sender: req.params.username });

        const deletedUser = await User.findOneAndDelete({ username: req.params.username });

        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ err: 'An error occurred while deleting user' });
    }
};