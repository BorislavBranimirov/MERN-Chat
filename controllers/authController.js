const { User } = require('../models');
const jwt = require('jsonwebtoken');
const authUtils = require('../utils/authUtils');
const userUtils = require('../utils/userUtils');

exports.verifyAccessToken = (req, res, next) => {
    // access token should be supplied in an Authorization header with a Bearer schema
    if (req.headers['authorization'] === undefined ||
        req.headers['authorization'].split(' ')[0] !== 'Bearer') {
        return res.status(401).json({ err: 'Unauthorized' });
    }

    const accessToken = req.headers['authorization'].split(' ')[1];

    try {
        // keep in mind that verify isn't asynchronous
        // https://github.com/auth0/node-jsonwebtoken/issues/111
        const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

        // attach the user info to the response object for use in further middleware
        res.locals.user = {
            id: payload.id,
            username: payload.username
        };

        next();
    } catch (err) {
        return res.status(401).json({ err: 'Unauthorized' });
    }
};

exports.login = async (req, res) => {
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
        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            return res.status(422).json({ err: 'Wrong username or password' });
        }

        const isMatch = await user.comparePassword(req.body.password);
        if (!isMatch) {
            return res.status(422).json({ err: 'Wrong username or password' });
        }

        const accessToken = await authUtils.createAccessToken(user);

        const refreshToken = await authUtils.createRefreshToken(user);

        authUtils.addRefreshCookie(req, res, refreshToken);

        return res.json({
            accessToken: accessToken
        });
    } catch (err) {
        return res.status(500).json({ err: 'An error occurred while trying to log in' });
    }
};

exports.refreshToken = async (req, res) => {
    // refresh token should be supplied in a cookie
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken === undefined) {
        return res.status(401).json({ err: 'No refresh token provided' });
    }

    try {
        // keep in mind that verify isn't asynchronous
        // https://github.com/auth0/node-jsonwebtoken/issues/111
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findOne({ username: payload.username });
        if (!user) {
            return res.status(422).json({ err: 'User doesn\'t exist' });
        }

        const newAccessToken = await authUtils.createAccessToken(user);

        const newRefreshToken = await authUtils.createRefreshToken(user);

        authUtils.addRefreshCookie(req, res, newRefreshToken);

        return res.json({
            accessToken: newAccessToken
        });
    } catch (err) {
        // if refresh token is expired send a 401, the user should log in again to receive a new one
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ err: 'Unauthorized' });
        }
        return res.status(500).json({ err: 'An error occurred while refreshing token' });
    }
};

exports.logout = async (req, res) => {
    authUtils.clearRefreshCookie(req, res);
    res.json({ 'success': true });
};