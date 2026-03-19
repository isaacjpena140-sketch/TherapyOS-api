const sgMail = require('@sendgrid/mail');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, subject, body, patientName } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: to,
      from: {
        email: process.env.SENDGRID_SENDER_EMAIL,
        name: 'TherapyOS'
      },
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0f4c81; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">TherapyOS</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="font-size: 16px;">Hi ${patientName || 'there'},</p>
            <p style="font-size: 16px;">${body}</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you need to reschedule please call us directly.
            </p>
          </div>
          <div style="padding: 15px; text-align: center; background: #eee;">
            <p style="font-size: 12px; color: #999;">Sent via TherapyOS — Confidential</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
