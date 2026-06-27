import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Send email function
const sendEmail = async (options) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Harry Potter Academy <info@harrypotteracademy.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error('Email could not be sent');
  }
};

// Email templates
const emailTemplates = {
  // Welcome Email
  welcome: (user) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #8B0000 0%, #660000 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .button { display: inline-block; background: #8B0000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { background: #f4f4f4; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏰 Welcome to Harry Potter Academy!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>Welcome to Harry Potter Academy! We're excited to have you join our magical learning community.</p>
            <p>Your account has been successfully created. You can now access your student panel and start your learning journey.</p>
            <a href="${process.env.FRONTEND_URL}/login" class="button">Access Your Account</a>
            <p style="margin-top: 30px;">Best regards,<br>The Harry Potter Academy Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Harry Potter Academy. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  // Registration Confirmation
  registrationConfirmation: (student, course) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #8B0000 0%, #660000 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .info-box { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f4f4f4; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Registration Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${student.name}</strong>,</p>
            <p>Your registration for <strong>${course.name}</strong> has been confirmed!</p>
            <div class="info-box">
              <p><strong>Course:</strong> ${course.name}</p>
              <p><strong>Start Date:</strong> ${new Date(course.startDate).toLocaleDateString()}</p>
              <p><strong>Schedule:</strong> ${course.schedule}</p>
              <p><strong>Branch:</strong> ${student.branch}</p>
            </div>
            <p>Our team will contact you within 24 hours with further details.</p>
            <p style="margin-top: 30px;">Best regards,<br>The Harry Potter Academy Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Harry Potter Academy. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  // Password Reset
  passwordReset: (user, resetToken) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #8B0000 0%, #660000 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .button { display: inline-block; background: #8B0000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .footer { background: #f4f4f4; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" class="button">Reset Password</a>
            <div class="warning">
              <p><strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
            </div>
            <p style="margin-top: 30px;">Best regards,<br>The Harry Potter Academy Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Harry Potter Academy. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  // Payment Confirmation
  paymentConfirmation: (student, payment) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #8B0000 0%, #660000 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .info-box { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .success { color: #28a745; font-weight: bold; }
          .footer { background: #f4f4f4; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Successful!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${student.name}</strong>,</p>
            <p class="success">Your payment has been successfully processed!</p>
            <div class="info-box">
              <p><strong>Amount:</strong> ${payment.amount} UZS</p>
              <p><strong>Payment Method:</strong> ${payment.method}</p>
              <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
              <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
            </div>
            <p>Thank you for your payment. Your course access has been updated.</p>
            <p style="margin-top: 30px;">Best regards,<br>The Harry Potter Academy Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Harry Potter Academy. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,
};

export { sendEmail, emailTemplates };
