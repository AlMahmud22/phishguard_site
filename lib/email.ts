import * as nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@phish.equators.tech';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using configured transporter
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email service not configured. Email not sent:', subject);
      return false;
    }

    await transporter.sendMail({
      from: `PhishGuard <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  const verificationUrl = `${SITE_URL}/auth/verify?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ Welcome to PhishGuard!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Thank you for registering with PhishGuard. To complete your registration and start protecting yourself from phishing attacks, please verify your email address.</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account with PhishGuard, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PhishGuard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '✅ Verify Your PhishGuard Account',
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
  const resetUrl = `${SITE_URL}/auth/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>We received a request to reset your password for your PhishGuard account.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong><br>
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
          </div>
          <p>For security reasons, we recommend choosing a strong password that you haven't used before.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PhishGuard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🔑 Reset Your PhishGuard Password',
    html,
  });
}

/**
 * Send account update notification
 */
export async function sendAccountUpdateEmail(email: string, name: string, updateType: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Account Update</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>This is to notify you that your PhishGuard account has been updated.</p>
          <div class="info">
            <strong>Update Type:</strong> ${updateType}<br>
            <strong>Date:</strong> ${new Date().toLocaleString()}<br>
            <strong>Email:</strong> ${email}
          </div>
          <p>If you didn't make this change, please contact our support team immediately and change your password.</p>
          <p>Stay safe!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PhishGuard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🔔 Your PhishGuard Account Was Updated',
    html,
  });
}

/**
 * Send account deletion confirmation email
 */
export async function sendAccountDeletionEmail(email: string, name: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .warning { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Account Deleted</h1>
        </div>
        <div class="content">
          <h2>Goodbye ${name},</h2>
          <p>Your PhishGuard account has been permanently deleted as requested.</p>
          <div class="warning">
            <strong>⚠️ Important:</strong><br>
            • All your data has been removed from our system<br>
            • Your scan history has been deleted<br>
            • This action cannot be undone<br>
            • Date: ${new Date().toLocaleString()}
          </div>
          <p>Thank you for using PhishGuard. We're sorry to see you go.</p>
          <p>If you change your mind, you can always create a new account at any time.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PhishGuard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '❌ Your PhishGuard Account Has Been Deleted',
    html,
  });
}

/**
 * Send welcome email (after verification)
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to PhishGuard!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Your email has been verified successfully! You're all set to start protecting yourself from phishing attacks.</p>
          
          <p style="text-align: center;">
            <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
          </p>

          <h3>🚀 Get Started:</h3>
          <div class="feature">
            <strong>📊 Dashboard:</strong> View your scan statistics and recent activity
          </div>
          <div class="feature">
            <strong>🔍 URL Scanner:</strong> Check suspicious links before clicking
          </div>
          <div class="feature">
            <strong>📜 History:</strong> Review all your previous scans
          </div>
          <div class="feature">
            <strong>⚙️ Settings:</strong> Customize your preferences
          </div>

          <p>Need help? Check out our documentation or contact support.</p>
          <p>Stay safe online! 🛡️</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PhishGuard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to PhishGuard - You\'re All Set!',
    html,
  });
}

/**
 * Send weekly report email
 */
export async function sendWeeklyReport(
  email: string,
  name: string,
  reportData: {
    totalScans: number;
    safeCount: number;
    warningCount: number;
    dangerCount: number;
    avgScore: number;
    topDangerousUrls: Array<{
      url: string;
      score: number;
      timestamp: Date;
      verdict: any;
    }>;
    scanTrend: Array<{ date: string; count: number }>;
    weekStart: string;
    weekEnd: string;
  }
): Promise<boolean> {
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const historyUrl = `${SITE_URL}/history`;
  
  // Generate trend sparkline (simple text-based)
  const maxScans = Math.max(...reportData.scanTrend.map(t => t.count), 1);
  const trendBars = reportData.scanTrend.map(t => {
    const height = Math.round((t.count / maxScans) * 100);
    return `<div style="display:inline-block;width:30px;height:${height}px;background:#667eea;margin:0 2px;vertical-align:bottom;" title="${t.date}: ${t.count} scans"></div>`;
  }).join('');
  
  // Top dangerous URLs HTML
  const dangerousUrlsHtml = reportData.topDangerousUrls.length > 0
    ? reportData.topDangerousUrls.map(url => `
        <div style="background:#fee2e2;padding:12px;margin:8px 0;border-radius:6px;border-left:4px solid #dc2626;">
          <strong>⚠️ ${url.url.length > 60 ? url.url.substring(0, 60) + '...' : url.url}</strong><br>
          <span style="color:#666;font-size:12px;">Score: ${url.score}/100 | ${new Date(url.timestamp).toLocaleDateString()}</span>
        </div>
      `).join('')
    : '<p style="color:#666;">No dangerous URLs detected this week. Great job! 🎉</p>';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat-box { background: white; padding: 20px; border-radius: 8px; text-align: center; flex: 1; margin: 0 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .section { margin: 30px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .trend-chart { background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Your Weekly PhishGuard Report</h1>
          <p style="margin:0;opacity:0.9;">Week of ${new Date(reportData.weekStart).toLocaleDateString()} - ${new Date(reportData.weekEnd).toLocaleDateString()}</p>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Here's your weekly security summary from PhishGuard. Stay informed about your online safety!</p>
          
          <div class="section">
            <h3>📈 Weekly Statistics</h3>
            <div class="stats" style="display:block;">
              <div class="stat-box" style="display:inline-block;width:22%;margin:5px;">
                <div class="stat-number">${reportData.totalScans}</div>
                <div class="stat-label">Total Scans</div>
              </div>
              <div class="stat-box" style="display:inline-block;width:22%;margin:5px;">
                <div class="stat-number" style="color:#10b981;">${reportData.safeCount}</div>
                <div class="stat-label">Safe</div>
              </div>
              <div class="stat-box" style="display:inline-block;width:22%;margin:5px;">
                <div class="stat-number" style="color:#f59e0b;">${reportData.warningCount}</div>
                <div class="stat-label">Warning</div>
              </div>
              <div class="stat-box" style="display:inline-block;width:22%;margin:5px;">
                <div class="stat-number" style="color:#dc2626;">${reportData.dangerCount}</div>
                <div class="stat-label">Danger</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>📊 Scan Activity Trend</h3>
            <div class="trend-chart">
              <div style="height:100px;display:flex;align-items:flex-end;justify-content:center;">
                ${trendBars}
              </div>
              <p style="margin:10px 0 0;color:#666;font-size:12px;">Daily scan activity over the past week</p>
            </div>
          </div>

          ${reportData.topDangerousUrls.length > 0 ? `
            <div class="section">
              <h3>⚠️ Top Dangerous URLs Blocked</h3>
              ${dangerousUrlsHtml}
              <p style="color:#10b981;font-weight:bold;">✅ You successfully avoided ${reportData.dangerCount} dangerous ${reportData.dangerCount === 1 ? 'URL' : 'URLs'} this week!</p>
            </div>
          ` : ''}

          <div class="section">
            <h3>🎯 Security Score</h3>
            <div style="background:white;padding:20px;border-radius:8px;text-align:center;box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="font-size:48px;font-weight:bold;color:${reportData.avgScore < 40 ? '#10b981' : reportData.avgScore < 70 ? '#f59e0b' : '#dc2626'};">${reportData.avgScore}</div>
              <p style="margin:5px 0;color:#666;">Average Threat Score</p>
              <p style="margin:10px 0;font-size:14px;color:#666;">
                ${reportData.avgScore < 40 ? '✅ Excellent! You\'re browsing safely.' : reportData.avgScore < 70 ? '⚠️ Be cautious. Some risky sites detected.' : '⚠️ High risk! Stay alert online.'}
              </p>
            </div>
          </div>

          <div style="text-align:center;margin:30px 0;">
            <a href="${dashboardUrl}" class="button">View Dashboard</a>
            <a href="${historyUrl}" class="button" style="background:#6b7280;">View Full History</a>
          </div>

          <div style="background:#dbeafe;padding:15px;border-radius:6px;margin:20px 0;">
            <strong>💡 Tip:</strong> Always verify sender email addresses and avoid clicking suspicious links. PhishGuard is here to help, but staying vigilant is your best defense!
          </div>

          <p style="font-size:12px;color:#666;">
            You're receiving this email because you have weekly reports enabled. 
            You can change your email preferences in your <a href="${SITE_URL}/settings">account settings</a>.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PhishGuard. All rights reserved.</p>
          <p>Stay safe online! 🛡️</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `📊 Your Weekly PhishGuard Report - ${reportData.totalScans} Scans`,
    html,
  });
}

/**
 * Send desktop app key created notification
 */
export async function sendDesktopKeyCreatedEmail(
  email: string,
  name: string,
  keyName: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 New Desktop Key Created</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>A new desktop application key has been created for your PhishGuard account.</p>
          <div class="info">
            <strong>📱 Key Name:</strong> ${keyName}<br>
            <strong>🕒 Created:</strong> ${new Date().toLocaleString()}<br>
            <strong>📧 Account:</strong> ${email}
          </div>
          <div class="warning">
            <strong>🔒 Security Reminder:</strong><br>
            • Keep your desktop key secure and don't share it<br>
            • Each key is unique to your desktop application<br>
            • You can revoke this key anytime from your dashboard<br>
            • Maximum 5 active keys allowed per account
          </div>
          <p>If you didn't create this key, please revoke it immediately from your settings and change your password.</p>
          <p>Stay safe!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PhishGuard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🔑 New Desktop Key Created - PhishGuard',
    html,
  });
}

/**
 * Send admin alert notification
 */
export async function sendAdminAlertEmail(
  email: string,
  alertType: string,
  alertMessage: string,
  details?: any
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 12px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Admin Alert</h1>
        </div>
        <div class="content">
          <h2>System Alert Notification</h2>
          <div class="alert">
            <strong>Alert Type:</strong> ${alertType}<br>
            <strong>Time:</strong> ${new Date().toLocaleString()}<br>
            <strong>Message:</strong> ${alertMessage}
          </div>
          ${details ? `
            <h3>Details:</h3>
            <div class="details">
              ${JSON.stringify(details, null, 2)}
            </div>
          ` : ''}
          <p>Please investigate and take appropriate action if necessary.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PhishGuard Admin System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `⚠️ PhishGuard Admin Alert: ${alertType}`,
    html,
  });
}

/**
 * Send newsletter/announcement email
 */
export async function sendNewsletterEmail(
  email: string,
  name: string,
  subject: string,
  content: string,
  cta?: { text: string; url: string }
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 ${subject}</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          ${content}
          ${cta ? `
            <p style="text-align: center;">
              <a href="${cta.url}" class="button">${cta.text}</a>
            </p>
          ` : ''}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PhishGuard. All rights reserved.</p>
          <p>You're receiving this because you're a valued PhishGuard user.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `📢 ${subject} - PhishGuard`,
    html,
  });
}

/**
 * Send test email (for configuration verification)
 */
export async function sendTestEmail(email: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Email Configuration Test</h1>
        </div>
        <div class="content">
          <h2>Success!</h2>
          <div class="success">
            <strong>✅ Email service is working correctly!</strong><br>
            Your PhishGuard email configuration has been successfully tested.
          </div>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Email sent to: ${email}</li>
            <li>Timestamp: ${new Date().toLocaleString()}</li>
            <li>SMTP Server: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}</li>
            <li>Port: ${process.env.EMAIL_PORT || '587'}</li>
          </ul>
          <p>All email features are now operational including:</p>
          <ul>
            <li>✅ Email verification</li>
            <li>✅ Password reset</li>
            <li>✅ Weekly reports</li>
            <li>✅ Account notifications</li>
            <li>✅ Admin alerts</li>
          </ul>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PhishGuard. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '✅ PhishGuard Email Test - Configuration Successful',
    html,
  });
}

/**
 * Verify email configuration on server startup
 */
export async function verifyEmailConfiguration(): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email service not configured - EMAIL_USER or EMAIL_PASSWORD missing');
      return false;
    }

    // Verify SMTP connection
    await transporter.verify();
    console.log('✅ Email service configured and ready');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    console.warn('⚠️ Email features will not work until configuration is fixed');
    return false;
  }
}
