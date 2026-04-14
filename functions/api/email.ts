// Email Service for Stalwart SMTP via Cloudflare Worker Sockets
import { WorkerMailer } from 'worker-mailer';

export class EmailService {
  constructor(
    private host: string,
    private port: number,
    private user: string,
    private pass: string,
    private from: string
  ) {}

  async sendVerificationEmail(to: string, token: string) {
    const verifyLink = `https://mealxu.pages.dev/api/auth/verify?token=${token}`;
    const subject = 'Verify your Mealsxu Account';
    const body = `Welcome to Mealsxu! Please verify your account by clicking here: ${verifyLink}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 2px solid #f97316; border-radius: 20px;">
        <h1 style="color: #f97316; text-transform: uppercase; font-style: italic;">MEALSXU</h1>
        <p>Welcome to the Midwest's premier shoppable recipe platform.</p>
        <p>Please verify your account to start planning your week:</p>
        <a href="${verifyLink}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0;">VERIFY ACCOUNT</a>
        <p style="font-size: 12px; color: #666;">If you didn't sign up for Mealsxu, please ignore this email.</p>
      </div>
    `;

    try {
      const mailer = await WorkerMailer.connect({
        host: this.host,
        port: this.port,
        secure: this.port === 465, // True for SSL/TLS, false for STARTTLS
        credentials: {
          username: this.user,
          password: this.pass,
        },
        authType: 'login'
      });

      await mailer.send({
        from: { name: 'Mealsxu', email: this.from },
        to: [{ email: to }],
        subject: subject,
        text: body,
        html: html,
      });

      console.log(`Verification email sent to: ${to}`);
      return true;
    } catch (err) {
      console.error('Failed to send email via Stalwart SMTP:', err);
      // Fallback log for dev/debug
      console.log(`[EMAIL FALLBACK] Link: ${verifyLink}`);
      return false;
    }
  }
}
