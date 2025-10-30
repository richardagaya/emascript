import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendConfirmationEmail(
  email: string,
  botName: string,
  orderId: string
) {
  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@akavanta.com',
      to: email,
      subject: `Your ${botName} is Ready! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 25px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 14px;
            }
            .highlight {
              background: #fff;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #667eea;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Payment Confirmed!</h1>
              <p>Your EA is ready to download</p>
            </div>
            <div class="content">
              <p>Hi there,</p>
              
              <p>Great news! Your payment has been confirmed and <strong>${botName}</strong> is now available in your dashboard.</p>
              
              <div class="highlight">
                <strong>Order ID:</strong> ${orderId}<br>
                <strong>EA Name:</strong> ${botName}<br>
                <strong>Status:</strong> ✅ Ready to Download
              </div>
              
              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard" class="button">
                  Go to Dashboard →
                </a>
              </p>
              
              <h3>📥 Next Steps:</h3>
              <ol>
                <li>Log in to your dashboard</li>
                <li>Click the "Download" button for your EA</li>
                <li>Follow our <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/installation-guide">installation guide</a></li>
                <li>Start automated trading!</li>
              </ol>
              
              <h3>💡 Need Help?</h3>
              <p>Our support team is available Monday - Friday, 7 AM - 5 PM.</p>
              <p>Email us at: <a href="mailto:support@akavanta.com">support@akavanta.com</a></p>
              
              <div class="footer">
                <p>Thank you for choosing Akavanta!</p>
                <p>This email was sent to ${email}</p>
                <p>&copy; ${new Date().getFullYear()} Akavanta. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${email}`);
    
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw error - email failure shouldn't block the payment process
  }
}

export async function sendOrderPendingEmail(
  email: string,
  botName: string,
  orderId: string,
  paymentMethod: string
) {
  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@akavanta.com',
      to: email,
      subject: `Order Confirmation - ${botName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .highlight {
              background: #fff;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #667eea;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Order Received!</h1>
              <p>Awaiting Payment Confirmation</p>
            </div>
            <div class="content">
              <p>Hi there,</p>
              
              <p>Thank you for your order! We've received your request to purchase <strong>${botName}</strong>.</p>
              
              <div class="highlight">
                <strong>Order ID:</strong> ${orderId}<br>
                <strong>EA Name:</strong> ${botName}<br>
                <strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}<br>
                <strong>Status:</strong> ⏳ Awaiting Payment
              </div>
              
              <p>Once your payment is confirmed, you'll receive another email with download instructions.</p>
              
              <p>Questions? Contact us at <a href="mailto:support@akavanta.com">support@akavanta.com</a></p>
              
              <div class="footer">
                <p>Thank you for choosing Akavanta!</p>
                <p>&copy; ${new Date().getFullYear()} Akavanta. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order pending email sent to ${email}`);
    
  } catch (error) {
    console.error('Error sending order pending email:', error);
  }
}

