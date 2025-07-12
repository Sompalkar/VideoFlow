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
      this.transporter.verify((error: any, success: any) => {
        if (error) {
          console.error("Email service configuration error:", error);
        } else {
          console.log("Email service is ready to send messages");
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
      console.log("Email sent successfully:", info.messageId);
    } catch (error) {
      console.error("Email sending failed:", error);
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
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 Welcome to VideoFlow!</h1>
              <p>You've been invited to join a creative team</p>
            </div>
            <div class="content">
              <h2>Hi there! 👋</h2>
              <p><strong>${data.inviterName}</strong> has invited you to join their team <strong>"${data.teamName}"</strong> as a <strong>${data.role}</strong>.</p>
              
              <div class="credentials">
                <h3>🔐 Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> <code>${data.tempPassword}</code></p>
                <p style="color: #e74c3c; font-size: 14px;">⚠️ Please change your password immediately after logging in.</p>
              </div>

              <div style="text-align: center;">
                <a href="${data.loginUrl}" class="button">🚀 Get Started Now</a>
              </div>

              <p>Welcome to the team! We're excited to have you on board. 🎉</p>
            </div>
            <div class="footer">
              <p>This invitation was sent by ${data.inviterName} from VideoFlow.</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
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
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Video Approved!</h1>
            </div>
            <div class="content">
              <h2>Great news! ✨</h2>
              <p>Your video <strong>"${
                data.videoTitle
              }"</strong> has been approved by <strong>${
      data.approverName
    }</strong>.</p>
              
              ${
                data.youtubeUrl
                  ? `
                <p>🚀 <strong>It's now live on YouTube!</strong></p>
                <div style="text-align: center;">
                  <a href="${data.youtubeUrl}" class="button">🎬 Watch on YouTube</a>
                </div>
              `
                  : `
                <p>📤 It will be uploaded to YouTube shortly.</p>
              `
              }
              
              <p>Keep up the excellent work! 👏</p>
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
