const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { getDbProvider } = require('../db/provider');
const db = require('../db/connection');
const User = require('../mongo/models/User');
const Reset = require('../mongo/models/PasswordReset');
const { sendResetMail } = require('./resetMailer');

const hash = token => crypto.createHash('sha256').update(token).digest('hex');
const TTL = 15 * 60 * 1000;
const recentRequests = new Map();
const responseMessage = 'Nếu email có tài khoản, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư.';

async function requestReset(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized) || normalized.length > 254) {
    throw Object.assign(new Error('Email không hợp lệ'), { status: 400 });
  }
  // Fail explicitly if no mail transport exists; never simulate successful delivery.
  if (!process.env.RESEND_API_KEY || !process.env.RESET_EMAIL_FROM || !process.env.RESET_PUBLIC_URL) {
    throw Object.assign(new Error('Chức năng gửi email chưa được cấu hình'), { status: 503 });
  }
  const now = Date.now();
  const last = recentRequests.get(normalized) || 0;
  if (now - last < 60_000) return responseMessage;
  recentRequests.set(normalized, now);
  if (recentRequests.size > 10_000) {
    for (const [key, time] of recentRequests) if (now - time > 60_000) recentRequests.delete(key);
  }
  const provider = getDbProvider();
  const user = provider === 'sqlite'
    ? db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND password IS NOT NULL').get(normalized)
    : await User.findOne({ email: normalized, password: { $ne: null } }).lean();
  if (!user) return responseMessage;
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hash(token);
  const expiresAt = new Date(now + TTL);
  if (provider === 'sqlite') {
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
    db.prepare('INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .run(tokenHash, user.id, expiresAt.toISOString());
  } else {
    await Reset.deleteMany({ user_id: user.id });
    await Reset.create({ token_hash: tokenHash, user_id: user.id, expires_at: expiresAt });
  }
  const base = new URL(process.env.RESET_PUBLIC_URL);
  if (base.protocol !== 'https:' && base.hostname !== 'localhost') throw Object.assign(new Error('Invalid reset URL configuration'), { status: 503 });
  const url = new URL('/reset-password', base);
  url.searchParams.set('token', token);
  try {
    await sendResetMail(normalized, url.toString());
  } catch (error) {
    if (provider === 'sqlite') db.prepare('DELETE FROM password_reset_tokens WHERE token_hash = ?').run(tokenHash);
    else await Reset.deleteOne({ token_hash: tokenHash });
    recentRequests.delete(normalized);
    throw Object.assign(new Error('Dịch vụ gửi email tạm thời không hoạt động'), { status: 503 });
  }
  return responseMessage;
}

async function resetPassword(token, password) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw Object.assign(new Error('Liên kết không hợp lệ'), { status: 400 });
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw Object.assign(new Error('Mật khẩu cần 8–128 ký tự'), { status: 400 });
  const tokenHash = hash(token);
  const newHash = await bcrypt.hash(password, 12);
  const provider = getDbProvider();
  if (provider === 'sqlite') {
    const commit = db.transaction(() => {
      const existing = db.prepare('SELECT * FROM password_reset_tokens WHERE token_hash = ?').get(tokenHash);
      if (!existing || Date.parse(existing.expires_at) <= Date.now()) return false;
      db.prepare('DELETE FROM password_reset_tokens WHERE token_hash = ?').run(tokenHash);
      return db.prepare('UPDATE users SET password = ?, auth_version = auth_version + 1 WHERE id = ?')
        .run(newHash, existing.user_id).changes === 1;
    });
    if (!commit()) throw Object.assign(new Error('Liên kết hết hạn hoặc đã được sử dụng'), { status: 400 });
  } else {
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    let updated = false;
    let resetUserId = null;
    try {
      await session.withTransaction(async () => {
        const reset = await Reset.findOneAndDelete({ token_hash: tokenHash, expires_at: { $gt: new Date() } }, { session });
        if (!reset) return;
        resetUserId = reset.user_id;
        const result = await User.updateOne({ id: reset.user_id }, { $set: { password: newHash }, $inc: { auth_version: 1 } }, { session });
        updated = result.modifiedCount === 1;
      });
    } finally { await session.endSession(); }
    if (!updated) throw Object.assign(new Error('Liên kết hết hạn hoặc đã được sử dụng'), { status: 400 });
    if (provider === 'dual') {
      const mirror = db.prepare('UPDATE users SET password = ?, auth_version = auth_version + 1 WHERE id = ?')
        .run(newHash, resetUserId);
      if (!mirror.changes) throw Object.assign(new Error('Password recovery mirror could not be updated'), { status: 503 });
    }

  }
  return { success: true };
}
module.exports = { requestReset, resetPassword };
