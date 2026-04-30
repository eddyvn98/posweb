const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { getStaffRepo } = require('../repositories/staff.repo');

// Middleware: chỉ owner mới được quản lý staff
function ownerOnly(req, res, next) {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Chi owner moi co quyen thuc hien thao tac nay' });
  }
  next();
}

// GET /api/staff — danh sách nhân viên trong shop
router.get('/', authenticateToken, async (req, res) => {
  try {
    const staff = await getStaffRepo().getStaffByShop(req.user.shop_id);
    res.json({ staff });
  } catch (err) {
    console.error('[staff] getStaff error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/staff/invite-codes — danh sách invite codes còn hiệu lực
router.get('/invite-codes', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const codes = await getStaffRepo().getActiveInviteCodesByShop(req.user.shop_id);
    res.json({ codes });
  } catch (err) {
    console.error('[staff] getInviteCodes error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/staff/invite — tạo invite code mới
router.post('/invite', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const invite = await getStaffRepo().createInviteCode(req.user.shop_id, req.user.id);
    res.json({ success: true, invite });
  } catch (err) {
    console.error('[staff] createInvite error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/staff/invite/:id — xóa invite code
router.delete('/invite/:id', authenticateToken, ownerOnly, async (req, res) => {
  try {
    const deleted = await getStaffRepo().deleteInviteCode(req.user.shop_id, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Invite code khong ton tai' });
    res.json({ success: true });
  } catch (err) {
    console.error('[staff] deleteInvite error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/staff/:id — xóa nhân viên khỏi shop (chỉ staff, không xóa owner)
router.delete('/:id', authenticateToken, ownerOnly, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Khong the tu xoa chinh minh' });
    }
    const deleted = await getStaffRepo().deleteStaff(req.user.shop_id, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Nhan vien khong ton tai' });
    res.json({ success: true });
  } catch (err) {
    console.error('[staff] deleteStaff error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
