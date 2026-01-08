import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  const smtpHost = process.env.NEXT_PUBLIC_SMTP_HOST
  const smtpPort = process.env.NEXT_PUBLIC_SMTP_PORT
  const smtpEmail = process.env.NEXT_PUBLIC_SMTP_EMAIL
  const smtpPass = process.env.NEXT_PUBLIC_SMTP_PASS

  if (!smtpHost || !smtpPort || !smtpEmail || !smtpPass) {
    throw new Error('SMTP configuration is missing. Please check your environment variables.')
  }

  const portNumber = parseInt(smtpPort, 10)
  const isSecurePort = portNumber === 465

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: portNumber,
    secure: isSecurePort, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: smtpEmail,
      pass: smtpPass,
    },
    // For STARTTLS (port 587), ensure TLS is enabled
    ...(!isSecurePort && {
      requireTLS: true,
      tls: {
        rejectUnauthorized: false, // Set to true in production with valid certificates
      },
    }),
  })

  try {
    const info = await transporter.sendMail({
      from: `"My Kunba" <${smtpEmail}>`,
      to,
      subject,
      html,
    })

    console.log('Email sent successfully:', info.messageId)
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export function getSubscriptionConfirmationEmail(email: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Confirmation - My Kunba</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">My Kunba</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">🎉 Successfully Subscribed!</h2>
          <p>Thank you for subscribing to My Kunba newsletter!</p>
          <p>We're excited to have you on board. You'll now receive the latest updates, blog posts, and news directly in your inbox.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0;"><strong>Your email:</strong> ${email}</p>
          </div>
          <p>Stay tuned for future updates and exciting content!</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>The My Kunba Team</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            If you didn't subscribe to this newsletter, please ignore this email.
          </p>
        </div>
      </body>
    </html>
  `
}
