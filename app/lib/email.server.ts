import { Resend } from 'resend'
import { APP_NAME } from '~/config'
import { env } from '~/lib/env.server'

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    console.log(`[Auth] Password reset for ${to}: ${resetUrl}`)
    return
  }

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="margin: 0 0 16px;">${APP_NAME}</h2>
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #18181b; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">Reset Password</a>
        <p style="color: #71717a; font-size: 14px;">If you didn't request this, you can safely ignore this email. The link expires in 1 hour.</p>
        <p style="color: #71717a; font-size: 14px;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="color: #71717a; font-size: 14px; word-break: break-all;">${resetUrl}</p>
      </div>
    `,
  })
}
