import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

// Prefer server-only env vars (SMTP_*) so secrets aren't exposed via NEXT_PUBLIC_; fall back to NEXT_PUBLIC_SMTP_*
function getEnv(key: string, publicKey: string): string {
  const server = process.env[key]
  if (server != null && server !== '') return server
  const pub = process.env[publicKey]
  if (pub != null && pub !== '') return pub
  return ''
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  const smtpHost = getEnv('SMTP_HOST', 'SMTP_HOST')
  const smtpPort = getEnv('SMTP_PORT', 'SMTP_PORT')
  const smtpEmail = getEnv('SMTP_EMAIL', 'SMTP_EMAIL')
  const smtpPass = getEnv('SMTP_PASS', 'SMTP_PASS')

  if (!smtpHost || !smtpPort || !smtpEmail || !smtpPass) {
    const missing = [
      !smtpHost && 'SMTP_HOST or SMTP_HOST',
      !smtpPort && 'SMTP_PORT or SMTP_PORT',
      !smtpEmail && 'SMTP_EMAIL or SMTP_EMAIL',
      !smtpPass && 'SMTP_PASS or SMTP_PASS',
    ].filter(Boolean)
    throw new Error(
      `SMTP configuration is missing. Set in .env: ${missing.join(', ')}. ` +
        'For Gmail use an App Password: https://support.google.com/accounts/answer/185833',
    )
  }

  const portNumber = parseInt(smtpPort, 10)
  const isSecurePort = portNumber === 465

  // Determine if it's Gmail or Outlook
  const isGmail = smtpHost.includes('gmail.com')
  const isOutlook =
    smtpHost.includes('outlook.com') ||
    smtpHost.includes('live.com') ||
    smtpHost.includes('hotmail.com')

  // Configure transporter based on provider
  const transporterConfig: any = {
    host: smtpHost,
    port: portNumber,
    secure: isSecurePort,
    auth: {
      user: smtpEmail.trim(),
      pass: smtpPass.trim(),
    },
    // Add debug logging in development
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
  }

  // Gmail-specific configuration
  if (isGmail) {
    if (isSecurePort) {
      // Port 465 (SSL)
      transporterConfig.secure = true
    } else {
      // Port 587 (STARTTLS)
      transporterConfig.secure = false
      transporterConfig.requireTLS = true
    }
    transporterConfig.tls = {
      rejectUnauthorized: false,
    }
  }

  // Outlook/Hotmail-specific configuration
  if (isOutlook) {
    if (isSecurePort) {
      transporterConfig.secure = true
    } else {
      transporterConfig.secure = false
      transporterConfig.requireTLS = true
    }
    transporterConfig.tls = {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    }
  }

  // Generic configuration for other providers
  if (!isGmail && !isOutlook) {
    if (!isSecurePort) {
      transporterConfig.requireTLS = true
      transporterConfig.tls = {
        rejectUnauthorized: false,
      }
    }
  }

  const transporter = nodemailer.createTransport(transporterConfig)

  // Verify connection in development
  if (process.env.NODE_ENV === 'development') {
    try {
      await transporter.verify()
    } catch (verifyError: any) {
      // Provide helpful error messages
      if (verifyError?.code === 'EAUTH') {
        throw new Error(
          `SMTP Authentication Failed (${verifyError?.responseCode || 'N/A'}): ${verifyError?.response || verifyError?.message}\n\n` +
            `Common fixes:\n` +
            `- Check your email and password in .env file\n` +
            `- For Gmail: Use an App Password instead of your regular password (https://support.google.com/accounts/answer/185833)\n` +
            `- For Outlook: Check if "Less secure app access" is enabled or use an App Password\n` +
            `- Verify SMTP_HOST, SMTP_PORT, SMTP_EMAIL, and SMTP_PASS are correct\n` +
            `- Current config: Host=${smtpHost}, Port=${portNumber}, Email=${smtpEmail}`,
        )
      }
      throw verifyError
    }
  }

  try {
    const info = await transporter.sendMail({
      from: `"My Kunba" <${smtpEmail.trim()}>`,
      to: to.trim(),
      subject,
      html,
    })
  } catch (error: any) {
    // Provide helpful error messages
    if (error?.code === 'EAUTH') {
      const authError = new Error(
        `SMTP Authentication Failed (${error?.responseCode || 'N/A'}): ${error?.response || error?.message}\n\n` +
          `Common fixes:\n` +
          `- Check your email and password in .env file\n` +
          `- For Gmail: Use an App Password instead of your regular password\n` +
          `  (Enable 2FA, then generate App Password at: https://myaccount.google.com/apppasswords)\n` +
          `- For Outlook: Use an App Password (https://account.microsoft.com/security/app-passwords)\n` +
          `- Verify SMTP_HOST, SMTP_PORT, SMTP_EMAIL, and SMTP_PASS are correct\n` +
          `- Make sure there are no extra spaces in your .env file values`,
      )
      ;(authError as any).code = 'EAUTH'
      throw authError
    }
    throw error
  }
}

/** OTP email HTML for email verification or role downgrade. OTP valid 15 minutes. */
export function getOtpEmailHtml(
  purpose: 'email_verification' | 'role_downgrade',
  otp: string,
  recipientEmail: string,
): string {
  const isVerification = purpose === 'email_verification'
  const title = isVerification ? 'Verify your email' : 'Confirm role downgrade'
  const heading = isVerification ? 'Your verification code' : 'Your confirmation code'
  const bodyText = isVerification
    ? 'Use the code below to verify your email address on My Kunba. You can then upgrade to Content Author if you wish.'
    : 'Use the code below to confirm that you want to downgrade your account to a normal user. Your blogs will be moved to the recycle bin.'
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - My Kunba</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">My Kunba</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">${heading}</h2>
          <p>${bodyText}</p>
          <div style="background: white; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #667eea; text-align: center;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #666;">This code expires in 15 minutes. You can request a new code after 1.5 minutes if needed.</p>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">If you didn't request this, please ignore this email or secure your account.</p>
          <p style="margin-top: 24px;">Best regards,<br><strong>The My Kunba Team</strong></p>
        </div>
      </body>
    </html>
  `
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
