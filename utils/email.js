const nodemailer = require('nodemailer');
const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000';

/**
 * Email Service for sending notifications
 * Supports: Message notifications, reply notifications, portfolio updates
 */

// Configure your email service
// Using Gmail example - you can replace with your email provider
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Alternative: Using SendGrid
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Alternative: Using custom SMTP
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: process.env.SMTP_SECURE === 'true',
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD
//   }
// });

/**
 * Send message received notification to portfolio owner
 */
const sendMessageNotification = async (message, portfolioOwner, isReply = false) => {
  try {
    const latestReply = message.replies && message.replies.length > 0 
      ? message.replies[message.replies.length - 1] 
      : null;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: portfolioOwner.email,
      subject: isReply 
        ? `New Reply: ${message.subject || 'Conversation'}` 
        : `New Message: ${message.subject || 'No Subject'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${isReply ? 'New Reply to Your Conversation' : 'New Message from Your Portfolio'}</h2>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>From:</strong> ${message.senderName} (${message.senderEmail})</p>
            <p><strong>Subject:</strong> ${message.subject || 'No Subject'}</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
            ${isReply && latestReply 
              ? `<p style="line-height: 1.6; white-space: pre-wrap;">${latestReply.message}</p>`
              : `<p style="line-height: 1.6; white-space: pre-wrap;">${message.message}</p>`
            }
          </div>

          ${message.replies && message.replies.length > 0 ? `
          <div style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px; margin-bottom: 10px;">
              <strong>Conversation history (${message.replies.length} ${message.replies.length === 1 ? 'reply' : 'replies'}):</strong>
            </p>
          </div>
          ` : ''}

          <div style="background: #e7f3ff; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
            <p><strong>Reply to this conversation:</strong></p>
            <p><a href="${process.env.FRONTEND_URL}/dashboard/messages" 
                   style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View & Reply
            </a></p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email. Please don't reply to this address.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Message notification sent to ${portfolioOwner.email}`);
  } catch (error) {
    console.error('Error sending message notification:', error);
    throw error;
  }
};

/**
 * Send reply notification to message sender
 */
const sendReplyNotification = async (message, portfolioOwner) => {
  try {
    const latestReply = message.replies && message.replies.length > 0 
      ? message.replies[message.replies.length - 1] 
      : null;

    if (!latestReply) {
      console.log('No reply to send');
      return;
    }

    const replyLink = `${process.env.FRONTEND_URL}/reply/${message.replyToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: message.senderEmail,
      subject: `Re: ${message.subject || 'Your Message'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Reply from ${portfolioOwner.fullName}</h2>
          
          <p>Hi ${message.senderName},</p>
          
          <p>${portfolioOwner.fullName} has replied to your message:</p>

          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <p style="line-height: 1.6; white-space: pre-wrap; margin: 0;">${latestReply.message}</p>
            <p style="color: #999; font-size: 11px; margin-top: 10px;">${new Date(latestReply.createdAt).toLocaleString()}</p>
          </div>

          ${message.replies.length > 1 ? `
          <div style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              <strong>Conversation thread (${message.replies.length} messages):</strong>
            </p>
          </div>
          ` : ''}

          <div style="background: #e7f3ff; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
            <p><strong>Continue the conversation:</strong></p>
            <p><a href="${replyLink}" 
                   style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reply to ${portfolioOwner.fullName}
            </a></p>
          </div>

          <div style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              <strong>Original Message:</strong>
            </p>
            <p style="background: #f9f9f9; padding: 10px; border-left: 4px solid #ccc; margin: 10px 0; font-size: 12px; line-height: 1.5; color: #666; white-space: pre-wrap;">
              ${message.message}
            </p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email. Use the reply button above to continue the conversation.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reply notification sent to ${message.senderEmail}`);
  } catch (error) {
    console.error('Error sending reply notification:', error);
    throw error;
  }
};

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (user) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to Portfolio Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Portfolio Platform!</h2>
          
          <p>Hi ${user.fullName},</p>
          
          <p>Your portfolio account has been created successfully. Here's what you can do:</p>

          <ul style="line-height: 1.8; color: #555;">
            <li>Create and manage your professional portfolio</li>
            <li>Showcase your skills, projects, and experience</li>
            <li>Manage meetings and schedule with visitors</li>
            <li>Track habits and maintain streaks</li>
            <li>Receive and reply to visitor messages</li>
            <li>Customize your portfolio appearance</li>
          </ul>

          <p style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you have any questions, feel free to contact our support team.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

/**
 * Test email configuration
 */
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✓ Email service configured successfully');
    return true;
  } catch (error) {
    console.error('✗ Email service configuration failed:', error);
    return false;
  }
};

/**
 * Send auto-responder to visitor on message receipt
 */
const sendAutoResponder = async (message, portfolioOwner, autoresponderMessage) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: message.senderEmail,
      subject: `Thanks for reaching out, ${portfolioOwner.fullName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">We received your message</h2>
          <p>Hi ${message.senderName},</p>
          <p>${autoresponderMessage || 'Thanks for contacting me! I will get back to you as soon as possible.'}</p>
          <div style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;"><strong>Your original message:</strong></p>
            <p style="background: #f9f9f9; padding: 10px; border-left: 4px solid #ccc; margin: 10px 0; font-size: 12px; line-height: 1.5; color: #666; white-space: pre-wrap;">
              ${message.message}
            </p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated acknowledgement.</p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending auto-responder:', error);
    // Do not throw, auto-responder is non-critical
  }
};

/**
 * Send newsletter email to subscribers (with tracking + unsubscribe)
 */
const sendNewsletterEmail = async ({ email, subject, content, senderName, campaignId, unsubscribeToken }) => {
  try {
    const pixel = campaignId ? `<img src="${API_BASE}/api/newsletter/open/${campaignId}.png" width="1" height="1" style="display:none;" alt=""/>` : '';
    const ctaUrl = process.env.FRONTEND_URL || `${API_BASE}`;
    const trackedCta = campaignId ? `${API_BASE}/api/newsletter/click/${campaignId}?url=${encodeURIComponent(ctaUrl)}` : ctaUrl;
    const unsubUrl = unsubscribeToken
      ? `${API_BASE}/api/newsletter/unsubscribe/${unsubscribeToken}`
      : `${process.env.FRONTEND_URL}/unsubscribe`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="border-bottom: 3px solid #2196F3; padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="color: #333; margin: 0;">Newsletter from ${senderName}</h1>
          </div>

          <div style="line-height: 1.8; color: #555; margin: 20px 0;">
            ${content}
          </div>

          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 30px 0; text-align: center;">
            <a href="${trackedCta}" 
               style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Visit Portfolio
            </a>
          </div>

          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              You're receiving this because you subscribed to ${senderName}'s newsletter.
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              <a href="${unsubUrl}" style="color: #2196F3; text-decoration: none;">
                Unsubscribe
              </a>
            </p>
          </div>
          ${pixel}
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Newsletter sent to ${email}`);
  } catch (error) {
    console.error('Error sending newsletter:', error);
    throw error;
  }
};

/**
 * Send double opt-in confirmation email
 */
const sendOptInEmail = async ({ email, token }) => {
  const confirmUrl = `${API_BASE}/api/newsletter/confirm/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Confirm your subscription',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Please confirm your subscription</h2>
        <p>Click the button below to confirm you want to receive emails.</p>
        <p>
          <a href="${confirmUrl}" style="background:#4CAF50;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Confirm Subscription</a>
        </p>
        <p style="color:#888;font-size:12px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendMessageNotification,
  sendReplyNotification,
  sendAutoResponder,
  sendWelcomeEmail,
  sendNewsletterEmail,
  sendOptInEmail,
  testEmailConfig,
  transporter
};
