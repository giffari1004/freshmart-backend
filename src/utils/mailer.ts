// import nodemailer from "nodemailer";
// import {
//   SMTP_HOST,
//   SMTP_PORT,
//   SMTP_USER,
//   SMTP_PASS,
//   FRONTEND_URL,
// } from "../configs/env-config";

// const transporter = nodemailer.createTransport({
//   host: SMTP_HOST,
//   port: SMTP_PORT,
//   secure: false,
//   auth: { user: SMTP_USER, pass: SMTP_PASS },
// });

// export class MailerUtil {
//   static async sendVerificationEmail(to: string, token: string) {
//     const link = `${FRONTEND_URL}/verify-email?token=${token}`;
//     await transporter.sendMail({
//       from: `"FreshMart" <${SMTP_USER}>`,
//       to,
//       subject: "Verifikasi email FreshMart kamu",
//       html: `<p>Klik link berikut untuk verifikasi email (berlaku 1 jam):</p><a href="${link}">${link}</a>`,
//     });
//   }

//   static async sendResetPasswordEmail(to: string, token: string) {
//     const link = `${FRONTEND_URL}/reset-password/confirm?token=${token}`;
//     await transporter.sendMail({
//       from: `"FreshMart" <${SMTP_USER}>`,
//       to,
//       subject: "Reset password FreshMart",
//       html: `<p>Klik link berikut untuk reset password (berlaku 1 jam):</p><a href="${link}">${link}</a>`,
//     });
//   }
// }
