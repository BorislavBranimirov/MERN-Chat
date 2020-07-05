const { Message, User, ChatRoom } = require('../models');

exports.getAllByChatRoom = async (req, res) => {
    try {
        const chatRoom = await ChatRoom.findById(req.params.id);
        if (!chatRoom) {
            return res.status(404).json({ err: 'Chat room not found' });
        }

        // check if user has access to chat room
        const user = await User.findById(res.locals.user.id, { 'chatRoomList': 1 });
        if (!user.chatRoomList.includes(req.params.id)) {
            return res.status(401).json({ err: 'Unauthorised to view messages in this chat room' });
        }

        let messageQuery = { chatRoomId: req.params.id };
        if (req.query.before) {
            // query to get message's date
            const previousMessage = await Message.findById(req.query.before);
            if (!previousMessage) {
                return res.status(404).json({ err: 'Message not found' });
            }

            messageQuery.createdAt = { $lt: previousMessage.createdAt };
        }

        let messages = await Message.find(messageQuery)
            .sort({ createdAt: -1 })
            .limit((isNaN(req.query.limit)) ? 0 : parseInt(req.query.limit, 10));

        return res.json(messages);
    } catch (err) {
        return res.status(500).send({ err: 'An error occurred while searching for messages' });
    }
};

exports.getOneById = async (req, res) => {
    try {
        let message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ err: 'Message not found' });
        }

        // check if user has access to chat room
        const user = await User.findById(res.locals.user.id, { 'chatRoomList': 1 });
        if (!user.chatRoomList.includes(message.chatRoomId)) {
            return res.status(401).json({ err: 'Unauthorised to view message' });
        }

        return res.json(message);
    } catch (err) {
        return res.status(500).send({ err: 'An error occurred while searching for message' });
    }
};

exports.createOne = async (req, res) => {
    try {
        // check if user has access to chat room
        const user = await User.findById(res.locals.user.id, { 'username': 1, 'chatRoomList': 1 });
        if (!user.chatRoomList.includes(req.params.id)) {
            return res.status(401).json({ err: 'Unauthorised to add messages to this chat room' });
        }

        if (!req.body.body) {
            return res.status(422).json({ err: 'No message body provided' });
        }

        // all messages should be trimmed, before being saved
        let body = req.body.body.trim();

        // check the length of the trimmer message
        if (body.length === 0) {
            return res.status(422).json({ err: 'Invalid message body' });
        }

        const newMessage = new Message({
            chatRoomId: req.params.id,
            sender: res.locals.user.username,
            body: body
        });

        const message = await newMessage.save();

        // send new message to all users currently in the chat room
        res.locals.io.to(message.chatRoomId.toString()).emit('addMessage', message);

        // clear typing indicators
        res.locals.io.to(message.chatRoomId.toString()).emit('userStoppedTyping', user.username);

        return res.json({
            success: true,
            id: message._id
        });
    } catch (err) {
        return res.status(500).json({ err: 'An error occured while creating message' });
    };
};

exports.changeOneById = async (req, res) => {
    try {
        if (!req.body.body) {
            return res.status(422).json({ err: 'No message body provided' });
        }

        // all messages should be trimmed, before being saved
        let body = req.body.body.trim();

        // check the length of the trimmer message
        if (body.length === 0) {
            return res.status(422).json({ err: 'Invalid message body' });
        }

        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ err: 'Message not found' });
        }

        // check if user is message's author
        if (res.locals.user.username !== message.sender) {
            return res.status(401).json({ err: 'Unauthorised to change message' });
        }

        if (body === message.body) {
            return res.status(422).json({ err: 'No changes from original message body were provided' });
        }

        message.body = body;

        const patchedMessage = await message.save();

        // send patched message to all users currently in the chat room
        res.locals.io.to(patchedMessage.chatRoomId.toString()).emit('editMessage', patchedMessage);

        return res.json({
            success: true,
            id: patchedMessage._id
        });
    } catch (err) {
        return res.status(500).json({ err: 'An error occured while updating message' });
    };
};

exports.deleteOneById = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ err: 'Message not found' });
        }

        // check if user is message's author
        if (res.locals.user.username !== message.sender) {
            return res.status(401).json({ err: 'Unauthorised to delete message' });
        }

        const deletedMessage = await Message.findByIdAndDelete(req.params.id);
        if (!deletedMessage) {
            return res.status(404).json({ err: 'Message not found' });
        }

        // send deleted message id to all users currently in the chat room
        res.locals.io.to(deletedMessage.chatRoomId.toString()).emit('deleteMessage', deletedMessage._id.toString());

        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ err: 'An error occured while deleting message' });
    };
};