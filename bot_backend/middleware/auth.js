const authService = require('../services/authService');
const { getAuthRepo } = require('../repositories/auth.repo');

// Password changes and recovery invalidate previously issued JWTs.
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.sendStatus(401);
    const claims = authService.verifyToken(token);
    if (!claims) return res.sendStatus(403);
    try {
        const user = await getAuthRepo().getUserById(claims.id);
        if (!user || Number(user.auth_version || 0) !== Number(claims.auth_version || 0)) {
            return res.sendStatus(403);
        }
        // Never trust role/shop permissions copied from a potentially stale JWT.
        req.user = { ...claims, shop_id: user.shop_id, role: user.role, email: user.email };
        next();
    } catch (error) {
        console.error('Authentication lookup failed', error);
        res.status(503).json({ error: 'Authentication temporarily unavailable' });
    }
}
module.exports = authenticateToken;
