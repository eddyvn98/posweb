async function sendResetMail(to, url) {
  const sender = process.env.RESET_EMAIL_FROM;
  const key = process.env.RESEND_API_KEY;
  if (!key || !sender) throw new Error('Email delivery not configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: sender, to: [to], subject: 'Đặt lại mật khẩu PosWebFree',
      text: `Bạn đã yêu cầu đặt lại mật khẩu PosWebFree. Liên kết có hiệu lực trong 15 phút và chỉ dùng một lần:\n\n${url}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`
    })
  });
  if (!response.ok) throw new Error('Mail provider rejected request');
}
module.exports = { sendResetMail };
