const authService = require('../services/authService');

function authenticateToken(req, res, next) {
    let token = req.cookies?.token;
    if (!token) {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) return res.sendStatus(401);

    const user = authService.verifyToken(token);
    if (!user) return res.sendStatus(403);

    req.user = user;
    next();
}

function ownerOnly(req, res, next) {
    if (!req.user || req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Chi owner moi co quyen thuc hien thao tac nay' });
    }
    next();
}

module.exports = { authenticateToken, ownerOnly };

