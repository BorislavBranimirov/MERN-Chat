const express = require('express');
const http =  require('http');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const app = express();

// server
const server = http.createServer(app);

// .env
require('dotenv').config();

// body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// cookie-parser
app.use(cookieParser());

// morgan
app.use(morgan('tiny'));

// set up mongoose
const db = process.env.MONGO_URI;
mongoose.connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected...'))
    .catch((err) => console.log(err));

// socket.io
const io = require('./config/socketServer')(server);
app.use((req, res, next)=>{
    res.locals.io = io;
    next();
});

// routing
const { messageRouter, chatRoomRouter, userRouter, authRouter } = require('./routes');
app.use('/api/messages', messageRouter);
app.use('/api/chatrooms', chatRoomRouter);
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);

// serving react app
if (process.env.NODE_ENV === 'production') {
    app.use('/dist', express.static(path.join(__dirname, 'client', 'dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
    });
}

const port = process.env.PORT || 8000;

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});