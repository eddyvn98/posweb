const authService = require('../services/authService');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    const user = authService.verifyToken(token);
    if (!user) return res.sendStatus(403);

    req.user = user;
    next();
}

module.exports = authenticateToken;
