import nodemailer from "nodemailer";

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter;

  private static validateEmailConfig() {
    if (!process.env.EMAIL_USER) {
      throw new Error(
        "EMAIL_USER environment variable is required. Please set it in your .env file."
      );
    }
    if (!process.env.EMAIL_PASS) {
      throw new Error(
        "EMAIL_PASS environment variable is required. Please set it in your .env file."
      );
    }
  }

  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.validateEmailConfig();

      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER!,
          pass: process.env.EMAIL_PASS!,
        },
      });

      // Verify connection configuration
      this.transporter.verify((error: Error | null, success: boolean) => {
        if (error) {
          /* console log removed */
        } else {
          /* console log removed */
        }
      });
    }
    return this.transporter;
  }

  private static async sendEmail(emailData: EmailData): Promise<void> {
    try {
      this.validateEmailConfig();

      const transporter = this.getTransporter();
      const mailOptions = {
        from: `"VideoFlow" <${process.env.EMAIL_USER!}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      };

      const info = await transporter.sendMail(mailOptions);
      /* console log removed */
    } catch (error) {
      /* console log removed */
      throw new Error("Failed to send email");
    }
  }

  static async sendInvitation(
    email: string,
    data: {
      teamName: string;
      inviterName: string;
      role: string;
      tempPassword: string;
      loginUrl: string;
    }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation - VideoFlow</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #18181b; background-color: #fafafa; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; }
            .header { background: #09090b; color: white; padding: 40px 30px; text-align: center; }
            .header img { height: 40px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; }
            .content { padding: 40px 30px; }
            .credentials { background: #f4f4f5; padding: 20px; margin: 24px 0; border-left: 4px solid #2563eb; }
            .credentials h3 { margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #52525b; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; font-weight: 600; text-transform: uppercase; font-size: 14px; letter-spacing: 0.05em; margin: 24px 0; text-align: center; }
            .footer { padding: 30px; text-align: center; color: #71717a; font-size: 13px; border-top: 1px solid #e4e4e7; background: #fafafa; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to VideoFlow</h1>
            </div>
            <div class="content">
              <h2>Hi there! 👋</h2>
              <p><strong>${data.inviterName}</strong> has invited you to join their team <strong>"${data.teamName}"</strong> as a <strong>${data.role}</strong>.</p>
              
              <div class="credentials">
                <h3>Your Login Credentials</h3>
                <p style="margin-bottom: 8px;"><strong>Email:</strong> ${email}</p>
                <p style="margin-top: 0;"><strong>Password:</strong> <code style="background: #e4e4e7; padding: 2px 6px; border-radius: 4px;">${data.tempPassword}</code></p>
                <p style="color: #dc2626; font-size: 13px; margin-bottom: 0;">⚠️ Please change your password immediately after logging in.</p>
              </div>

              <div style="text-align: center;">
                <a href="${data.loginUrl}" class="button">Get Started Now</a>
              </div>
            </div>
            <div class="footer">
              <p>This invitation was sent by ${data.inviterName} from VideoFlow.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to VideoFlow!
      
      ${data.inviterName} has invited you to join their team "${data.teamName}" as a ${data.role}.
      
      Your login credentials:
      Email: ${email}
      Password: ${data.tempPassword}
      
      Please log in at ${data.loginUrl} and change your password immediately.
      
      Welcome to the team!
    `;

    await this.sendEmail({
      to: email,
      subject: `🎬 You've been invited to join ${data.teamName} on VideoFlow`,
      html,
      text,
    });
  }

  static async sendVideoApprovalNotification(
    email: string,
    data: {
      videoTitle: string;
      approverName: string;
      youtubeUrl?: string;
    }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Video Approved - VideoFlow</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #18181b; background-color: #fafafa; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; }
            .header { background: #09090b; color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; font-weight: 600; text-transform: uppercase; font-size: 14px; letter-spacing: 0.05em; margin: 24px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Video Approved!</h1>
            </div>
            <div class="content">
              <h2>Great news! ✨</h2>
              <p>Your video <strong>"${data.videoTitle}"</strong> has been approved by <strong>${data.approverName}</strong>.</p>
              
              ${
                data.youtubeUrl
                  ? `
                <p><strong>It's now live on YouTube!</strong></p>
                <div style="text-align: center;">
                  <a href="${data.youtubeUrl}" class="button">Watch on YouTube</a>
                </div>
              `
                  : `
                <p>It will be uploaded to YouTube shortly.</p>
              `
              }
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `✅ Video "${data.videoTitle}" has been approved!`,
      html,
    });
  }

  static async sendVideoRejectionNotification(
    email: string,
    data: {
      videoTitle: string;
      rejectorName: string;
      reason: string;
    }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Video Needs Revision - VideoFlow</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
            .feedback { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Video Needs Revision</h1>
            </div>
            <div class="content">
              <h2>Hi there! 👋</h2>
              <p>Your video <strong>"${data.videoTitle}"</strong> has been reviewed by <strong>${data.rejectorName}</strong> and needs some adjustments.</p>
              
              <div class="feedback">
                <h3>💬 Feedback:</h3>
                <p>${data.reason}</p>
              </div>
              
              <p>Please make the necessary changes and resubmit when ready. We're here to help you create amazing content! 🚀</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `📝 Video "${data.videoTitle}" needs revision`,
      html,
    });
  }

  static async sendVideoUploadNotification(
    email: string,
    data: {
      videoTitle: string;
      uploaderName: string;
      teamName: string;
      videoUrl?: string;
    }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Video Uploaded - VideoFlow</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f3f4f6; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 New Video Uploaded!</h1>
            </div>
            <div class="content">
              <h2>A new video has been uploaded to <strong>${
                data.teamName
              }</strong></h2>
              <p><strong>${data.uploaderName}</strong> just uploaded <strong>"${
      data.videoTitle
    }"</strong>.</p>
              ${
                data.videoUrl
                  ? `<div style="text-align: center;"><a href="${data.videoUrl}" class="button">View Video</a></div>`
                  : ""
              }
              <p>Log in to review, comment, or approve this video.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    await this.sendEmail({
      to: email,
      subject: `🎬 New video uploaded: ${data.videoTitle}`,
      html,
    });
  }

  static async sendVideoPublishedNotification(
    email: string,
    data: {
      videoTitle: string;
      uploaderName: string;
      youtubeUrl: string;
      teamName: string;
    }
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Video Published to YouTube - VideoFlow</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #f59e42 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📢 Video Published!</h1>
            </div>
            <div class="content">
              <h2>"${data.videoTitle}" is now live on YouTube!</h2>
              <p>Uploaded by <strong>${data.uploaderName}</strong> for team <strong>${data.teamName}</strong>.</p>
              <div style="text-align: center;">
                <a href="${data.youtubeUrl}" class="button">Watch on YouTube</a>
              </div>
              <p>Share and celebrate your team's new content!</p>
            </div>
          </div>
        </body>
      </html>
    `;
    await this.sendEmail({
      to: email,
      subject: `📢 Video published to YouTube: ${data.videoTitle}`,
      html,
    });
  }
}
