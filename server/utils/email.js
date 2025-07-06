import nodemailer from "nodemailer";
import { promises as fs } from "fs";
import path from "path";

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === "production") {
    // Production email configuration
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Development - use console or test account
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "ethereal.user@ethereal.email",
        pass: "ethereal.pass",
      },
    });
  }
};

// Load email template
const loadTemplate = async (templateName, context = {}) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates/email",
      `${templateName}.html`
    );
    let template = await fs.readFile(templatePath, "utf8");

    // Simple template replacement
    Object.keys(context).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      template = template.replace(regex, context[key]);
    });

    return template;
  } catch (error) {
    console.error("Template loading error:", error);
    return null;
  }
};

// Send email function
const sendEmail = async (options) => {
  const transporter = createTransporter();

  let html = options.html;

  // Load template if specified
  if (options.template) {
    html = await loadTemplate(options.template, options.context);
  }

  // Fallback to plain text if template loading fails
  if (!html && options.template) {
    html = generateBasicTemplate(options.template, options.context);
  }

  const mailOptions = {
    from: `"Gardening Care App" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: html || options.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};

// Generate basic template when file template is not available
const generateBasicTemplate = (templateName, context = {}) => {
  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; background-color: #f9f9f9; }
      .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
  `;

  switch (templateName) {
    case "welcome":
      return `
        <html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header">
              <h1>🌱 Welcome to Gardening Care App!</h1>
            </div>
            <div class="content">
              <h2>Hello ${context.name || "Gardener"}!</h2>
              <p>Thank you for joining our gardening community. We're excited to help you grow your perfect garden!</p>
              <p>To get started, please verify your email address:</p>
              <a href="${
                context.verificationUrl
              }" class="button">Verify Email Address</a>
              <p>Once verified, you can:</p>
              <ul>
                <li>🌿 Browse our comprehensive plant database</li>
                <li>📅 Set up personalized care schedules</li>
                <li>👥 Connect with fellow gardeners</li>
                <li>🌤️ Get weather-based gardening tips</li>
              </ul>
            </div>
            <div class="footer">
              <p>Happy Gardening!<br>The Gardening Care App Team</p>
            </div>
          </div>
        </body></html>
      `;

    case "passwordReset":
      return `
        <html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${context.name || "User"}!</h2>
              <p>You requested a password reset for your Gardening Care App account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${context.resetUrl}" class="button">Reset Password</a>
              <p><strong>This link will expire in 10 minutes.</strong></p>
              <p>If you didn't request this reset, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>Security Notice: If you're having trouble with the button, copy and paste this URL into your browser:<br>
              ${context.resetUrl}</p>
            </div>
          </div>
        </body></html>
      `;

    case "plantReminder":
      return `
        <html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header">
              <h1>🌱 Plant Care Reminder</h1>
            </div>
            <div class="content">
              <h2>Hello ${context.name || "Gardener"}!</h2>
              <p>This is a friendly reminder about your plant care:</p>
              <div style="background: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0;">
                <h3>${context.plantName}</h3>
                <p><strong>Task:</strong> ${context.taskType}</p>
                <p><strong>Due:</strong> ${context.dueDate}</p>
                ${
                  context.notes
                    ? `<p><strong>Notes:</strong> ${context.notes}</p>`
                    : ""
                }
              </div>
              <a href="${context.gardenUrl}" class="button">View Garden</a>
            </div>
            <div class="footer">
              <p>Keep growing!<br>The Gardening Care App Team</p>
            </div>
          </div>
        </body></html>
      `;

    default:
      return `
        <html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header">
              <h1>🌱 Gardening Care App</h1>
            </div>
            <div class="content">
              <h2>Hello ${context.name || "User"}!</h2>
              <p>Thank you for using Gardening Care App.</p>
            </div>
            <div class="footer">
              <p>Happy Gardening!<br>The Gardening Care App Team</p>
            </div>
          </div>
        </body></html>
      `;
  }
};

// Helper functions for specific email types
const sendWelcomeEmail = async (to, name, verificationUrl) => {
  return sendEmail({
    to,
    subject: "Welcome to Gardening Care App!",
    template: "welcome",
    context: { name, verificationUrl },
  });
};

const sendPasswordResetEmail = async (to, name, resetUrl) => {
  return sendEmail({
    to,
    subject: "Password Reset Request",
    template: "passwordReset",
    context: { name, resetUrl },
  });
};

const sendPlantCareReminder = async (
  to,
  name,
  plantName,
  taskType,
  dueDate,
  gardenUrl,
  notes
) => {
  return sendEmail({
    to,
    subject: "Plant Care Reminder",
    template: "plantReminder",
    context: { name, plantName, taskType, dueDate, gardenUrl, notes },
  });
};

const sendGroupInvitation = async (to, name, groupName, inviteUrl) => {
  return sendEmail({
    to,
    subject: "Garden Group Invitation",
    template: "welcome",
    context: { name, verificationUrl: inviteUrl },
  });
};

const sendNotificationEmail = async (to, subject, message) => {
  return sendEmail({
    to,
    subject,
    text: message,
  });
};

export {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPlantCareReminder,
  sendGroupInvitation,
  sendNotificationEmail,
};
