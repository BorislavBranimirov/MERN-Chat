const jwt = require('jsonwebtoken');

// 604800000 ms - one week
const msUntilRefreshTokenExpiry = 604800000;

module.exports.createAccessToken = async (user) => {
    return await jwt.sign({
        id: user._id,
        username: user.username
    }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

module.exports.createRefreshToken = async (user) => {
    return await jwt.sign({
        id: user._id,
        username: user.username
    }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: msUntilRefreshTokenExpiry / 1000 });
};

module.exports.addRefreshCookie = async (req, res, refreshToken) => {
    // req.baseUrl - currently /api/auth
    res.cookie('refreshToken', refreshToken, {
        expires: new Date(Date.now() + msUntilRefreshTokenExpiry),
        path: req.baseUrl + '/refresh-token',
        httpOnly: true,
        secure: true
    });
};

module.exports.clearRefreshCookie = (req, res) => {
    res.clearCookie('refreshToken', {
        path: req.baseUrl + '/refresh-token',
        httpOnly: true,
        secure: true
    });
};