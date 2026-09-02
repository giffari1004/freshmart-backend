import nodemailer from "nodemailer";
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  FRONTEND_URL,
} from "../configs/env-config";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

function baseEmailTemplate({
  heading,
  bodyHtml,
  ctaLabel,
  ctaLink,
}: {
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaLink: string;
}) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e4e4e7;">

          <!-- Header -->
          <tr>
            <td style="background-color:#ffffff; padding:24px 32px; text-align:center; border-bottom:2px solid #0f5132;">
              <img src="https://freshmart-frontend-six.vercel.app/images/logo-freshmart.png" alt="FreshMart" width="40" style="display:block; margin:0 auto;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px; font-size:20px; font-weight:700; color:#18181b;">
                ${heading}
              </h1>
              <div style="font-size:14px; line-height:1.6; color:#52525b;">
                ${bodyHtml}
              </div>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="border-radius:8px; background-color:#0f5132;">
                    <a href="${ctaLink}"
                       style="display:inline-block; padding:12px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="font-size:12px; color:#a1a1aa; line-height:1.5; margin:0;">
                Button tidak berfungsi? Salin dan tempel link berikut ke browser kamu:<br />
                <a href="${ctaLink}" style="color:#0f5132; word-break:break-all;">${ctaLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; background-color:#fafafa; border-top:1px solid #e4e4e7; text-align:center;">
              <p style="margin:0; font-size:11px; color:#a1a1aa;">
                Link ini berlaku selama <strong>1 jam</strong> sejak email ini dikirim.<br />
                Kalau kamu tidak melakukan permintaan ini, abaikan saja email ini.
              </p>
              <p style="margin:12px 0 0; font-size:11px; color:#d4d4d8;">
                © ${new Date().getFullYear()} FreshMart Grocery Inc.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
  `;
}

export class MailerUtil {
  static async sendVerificationEmail(to: string, token: string) {
    const link = `${FRONTEND_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: `"FreshMart" <${SMTP_USER}>`,
      to,
      subject: "Verifikasi email FreshMart kamu",
      html: baseEmailTemplate({
        heading: "Satu langkah lagi 👋",
        bodyHtml: `
          <p style="margin:0 0 12px;">Terima kasih sudah mendaftar di FreshMart!</p>
          <p style="margin:0;">Klik tombol di bawah untuk verifikasi email dan atur password akun kamu.</p>
        `,
        ctaLabel: "Verifikasi Email",
        ctaLink: link,
      }),
    });
  }

  static async sendResetPasswordEmail(to: string, token: string) {
    const link = `${FRONTEND_URL}/reset-password/confirm?token=${token}`;

    await transporter.sendMail({
      from: `"FreshMart" <${SMTP_USER}>`,
      to,
      subject: "Reset password FreshMart kamu",
      html: baseEmailTemplate({
        heading: "Reset password kamu 🔒",
        bodyHtml: `
          <p style="margin:0 0 12px;">Kami menerima permintaan untuk reset password akun FreshMart kamu.</p>
          <p style="margin:0;">Klik tombol di bawah untuk atur password baru.</p>
        `,
        ctaLabel: "Reset Password",
        ctaLink: link,
      }),
    });
  }
}
