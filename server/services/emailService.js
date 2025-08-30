const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Security check: Ensure credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env file');
  }
  
  // Security check: Don't log actual credentials
  console.log('📧 Email service initializing for:', process.env.EMAIL_USER.replace(/(.{2}).*(@.*)/, '$1***$2'));
  
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS  // Your email password or app password
    }
  });
};

// Send welcome email to newly added player
const sendPlayerWelcomeEmail = async (playerEmail, playerName, playerId) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: playerEmail,
      subject: 'Welcome to PlayerRadar - Your Player ID',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to PlayerRadar!</h2>
          
          <p>Dear ${playerName},</p>
          
          <p>You have been successfully added to the PlayerRadar system by a scout. We're excited to have you on board!</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #28a745; margin-top: 0;">Your Player ID</h3>
            <p style="font-size: 18px; font-weight: bold; color: #333; margin: 0;">
              ${playerId}
            </p>
          </div>
          
          <p>Please use this Player ID to register your account on the PlayerRadar platform:</p>
          
          <ol>
            <li>Visit the PlayerRadar registration page</li>
            <li>Click on "Register as Player"</li>
            <li>Enter your Player ID: <strong>${playerId}</strong></li>
            <li>Complete your registration</li>
          </ol>
          
          <p>Once registered, you'll be able to:</p>
          <ul>
            <li>View your player profile and statistics</li>
            <li>Upload videos and photos of your performance</li>
            <li>Track your trial history and progress</li>
            <li>Connect with scouts and clubs</li>
          </ul>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The PlayerRadar Team
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPlayerWelcomeEmail
};
