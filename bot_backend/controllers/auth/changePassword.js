const db = require('../../db/connection');
const bcrypt = require('bcryptjs');

function changePassword(req, res) {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Missing password fields' });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        const user = db.prepare('SELECT id, password FROM users WHERE id = ?').get(userId);
        if (!user || !user.password) {
            return res.status(404).json({ error: 'User not found or password auth unavailable' });
        }

        const isValidCurrent = bcrypt.compareSync(currentPassword, user.password);
        if (!isValidCurrent) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const isSamePassword = bcrypt.compareSync(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ error: 'New password must be different from current password' });
        }

        const newHash = bcrypt.hashSync(newPassword, 10);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newHash, userId);

        return res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change Password Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = changePassword;
