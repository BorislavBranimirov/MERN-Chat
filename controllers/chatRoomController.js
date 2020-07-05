const { ChatRoom, User, Message } = require('../models');
const chatRoomUtils = require('../utils/chatRoomUtils');

exports.getAll = async (req, res) => {
    try {
        // lean() to get plain objects and delete properties
        const chatRooms = await ChatRoom.find({}).lean();

        // replace the password property with a hasPassword boolean
        for (let i = 0; i < chatRooms.length; i++) {
            if (chatRooms[i].password !== '') {
                chatRooms[i].hasPassword = true;
            } else {
                chatRooms[i].hasPassword = false;
            }
            delete chatRooms[i].password;
        }

        return res.json(chatRooms);
    } catch (err) {
        return res.status(500).json({ err: 'An error occured while searching for chat rooms' });
    }
};

exports.getAllBySearch = async (req, res) => {
    let regex = new RegExp(req.body.nameFilter, 'i');
    let after = (req.query.after) ? req.query.after : 0;

    try {
        // lean() to get plain objects and delete properties
        const chatRooms = await ChatRoom.find({
            $and: [{ name: regex }, { name: { $gt: after } }]
        })
            .sort({ name: 1 })
            .limit(isNaN(req.query.limit) ? 0 : parseInt(req.query.limit))
            .lean();

        // replace the password property with a hasPassword boolean
        for (let i = 0; i < chatRooms.length; i++) {
            if (chatRooms[i].password !== '') {
                chatRooms[i].hasPassword = true;
            } else {
                chatRooms[i].hasPassword = false;
            }
            delete chatRooms[i].password;
        }

        return res.json(chatRooms);
    } catch (err) {
        return res.status(500).json({ err: 'An error occured while searching for chat rooms' });
    }
};

exports.getAllByUser = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ err: 'User not found' });
        }

        // check if user is chat room's author
        if (res.locals.user.username !== user.username) {
            return res.status(401).json({ err: 'Unauthorised to view user\'s chatrooms' });
        }

        // lean() to get plain objects and delete properties
        const chatRooms = await ChatRoom.find({ _id: { $in: user.chatRoomList } }).lean();

        // replace the password property with a hasPassword boolean
        for (let i = 0; i < chatRooms.length; i++) {
            if (chatRooms[i].password !== '') {
                chatRooms[i].hasPassword = true;
            } else {
                chatRooms[i].hasPassword = false;
            }
            delete chatRooms[i].password;
        }

        return res.json(chatRooms);
    } catch (err) {
        return res.status(500).json({ err: 'An error occured while searching for chat rooms' });
    }
};

exports.getOneById = async (req, res) => {
    try {
        // lean() to get plain objects and delete properties
        const chatRoom = await ChatRoom.findById(req.params.id).lean();
        if (!chatRoom) {
            return res.json(chatRoom);
        }

        // replace the password property with a hasPassword boolean
        if (chatRoom.password !== '') {
            chatRoom.hasPassword = true;
        } else {
            chatRoom.hasPassword = false;
        }
        delete chatRoom.password;

        return res.json(chatRoom);
    } catch (err) {
        return res.status(500).json({ err: 'An error occured while searching for chat room' });
    }
};

exports.createOne = async (req, res) => {
    // both name and password need to be provided
    // note: password can be an empty string, so check for undefined specifically
    if (!req.body.name || req.body.password === undefined) {
        return res.status(422).json({ err: 'No name or password provided' });
    }

    if (!chatRoomUtils.namePatternTest(req.body.name)) {
        return res.status(422).json({ err: 'Invalid name' });
    }
    if (!chatRoomUtils.passwordPatternTest(req.body.password)) {
        return res.status(422).json({ err: 'Invalid password' });
    }

    try {
        const user = await User.findOne({ username: res.locals.user.username });
        if (!user) {
            return res.status(404).json({ err: 'User not found' });
        }

        const chatRoomExists = await ChatRoom.findOne({ name: req.body.name });
        if (chatRoomExists) {
            return res.status(500).json({ err: 'Chat room already exists' });
        }

        const chatRoom = new ChatRoom({
            name: req.body.name,
            admin: res.locals.user.username,
            password: req.body.password
        });

        const newChatRoom = await chatRoom.save();

        // add the room to admin's chat room list
        user.chatRoomList.push(newChatRoom._id);
        const newUser = await user.save();

        return res.json({
            success: true,
            id: newChatRoom._id,
        });
    } catch (err) {
        return res.status(500).json({ err: 'An error occured while creating chat room' });
    }
};

exports.changeOneById = async (req, res) => {
    // password needs to be provided
    // note: password can be an empty string, so check for undefined specifically
    if (req.body.password === undefined) {
        return res.status(422).json({ err: 'No password provided' });
    }

    if (!chatRoomUtils.passwordPatternTest(req.body.password)) {
        return res.status(422).json({ err: 'Invalid password' });
    }

    try {
        const chatRoom = await ChatRoom.findById(req.params.id);
        if (!chatRoom) {
            return res.status(404).json({ err: 'Chat room not found' });
        }

        // check if user is chat room's owner
        if (res.locals.user.username !== chatRoom.admin) {
            return res.status(401).json({ err: 'Unauthorised to change chat room' });
        }

        const isMatch = await chatRoom.comparePassword(req.body.password)
        if (isMatch) {
            return res.status(422).json({ err: 'No changes from original chat room password were provided' });
        }

        chatRoom.password = req.body.password;

        const newChatRoom = await chatRoom.save();
        return res.json({
            success: true,
            id: newChatRoom._id,
        });
    } catch (err) {
        return res.status(500).json({ err: 'An error occured while updating chat room' });
    }
};

exports.deleteOneById = async (req, res) => {
    try {
        const chatRoom = await ChatRoom.findById(req.params.id);
        if (!chatRoom) {
            return res.status(404).json({ err: 'Chat room not found' });
        }

        // check if user is chat room's owner
        if (res.locals.user.username !== chatRoom.admin) {
            return res.status(401).json({ err: 'Unauthorised to delete chat room' });
        }

        // delete all of chat room's messages
        const deleteManyObj = await Message.deleteMany({ chatRoomId: req.params.id });

        // remove room from user lists
        const updateManyObj = await User.updateMany({}, { $pull: { chatRoomList: req.params.id } });

        const deletedChatRoom = await ChatRoom.findByIdAndDelete(req.params.id);
        if (!deletedChatRoom) {
            return res.status(404).json({ err: 'Chat room not found' });
        }

        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ err: 'An error occured while deleting chat room' });
    }
};

/**
 * Adds room id to user's chat room list (if not already added) and join the room with socket
 */
exports.chatRoomLogin = async (req, res) => {
    try {
        if (!req.body.socketId) {
            return res.status(401).json({ err: 'No socket information sent' });
        }

        const chatRoom = await ChatRoom.findById(req.params.id);
        if (!chatRoom) {
            return res.status(404).json({ err: 'Chat room not found' });
        }

        const user = await User.findOne({ username: res.locals.user.username });
        if (!user) {
            return res.status(404).json({ err: 'User not found' });
        }

        // don't duplicate rooms
        let newRoomAdded = false;
        if (!user.chatRoomList.includes(req.params.id)) {
            // check if chat room has a password
            let hasPassword = false;
            if (chatRoom.password !== '') {
                hasPassword = true;
            }

            // if user hasn't logged into the room and it has a password, check the password
            if (hasPassword) {
                if (!req.body.password) {
                    return res.status(422).json({ err: 'No password provided' });
                }
                const isMatch = await chatRoom.comparePassword(req.body.password)
                if (!isMatch) {
                    return res.status(422).json({ err: 'Wrong password' });
                }
            }

            user.chatRoomList.push(req.params.id);

            newRoomAdded = true;

            const newUser = await user.save();
        }

        // user's socket
        const socket = res.locals.io.sockets.sockets[req.body.socketId];

        // leave any other rooms, except the default room
        const rooms = Object.keys(socket.adapter.rooms);
        for (let i = 0; i < rooms.length; i++) {
            // note: leave() is asynchronous, so not leaving the room about to be joined is important!
            // if the code were to leave all rooms including the one to be joined and then join anew,
            // the leave would finish after the join, leaving the socket out of the room
            // even though the leave call comes before the join
            if (rooms[i] !== socket.id && rooms[i] !== req.params.id)
                socket.leave(rooms[i]);
        }

        // join the sent socket to the room
        // note: the join call is ignored if socket is already in the room, so no check is needed here
        socket.join(req.params.id);

        return res.json({
            success: true,
            newRoomAdded: newRoomAdded,
            id: chatRoom._id,
            name: chatRoom.name,
            admin: chatRoom.admin
        });

    } catch (err) {
        return res.status(500).json({ err: 'An error occured while logging into chat room' });
    }
};

/**
 * Remove room id from user's chat room list
 */
exports.chatRoomLogout = async (req, res) => {
    try {
        // remove room from user's list
        const updateOneObj = await User.updateOne({
            username: res.locals.user.username
        }, {
            $pull: { chatRoomList: req.params.id }
        });

        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ err: 'An error occured while updating user\'s list' });
    }
};