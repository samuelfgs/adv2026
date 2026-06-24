
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import ReactDOMServer from 'react-dom/server';
import { ADVEmailTemplate } from './isvRunEmailTemplate';
import { formatPrice } from '../../../lib/price-formatter';
import type { IscritoRecord } from '../mercadopago/webhook/types';

const emailHost = process.env.EMAIL_HOST || "smtpout.secureserver.net";
const emailPort = parseInt(process.env.EMAIL_PORT || "465");
const emailSecure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : true;
const emailUser = process.env.EMAIL_USER || "contato@igrejasv.com";
const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailSecure,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

export async function sendIsvRunEmail(record: IscritoRecord) {
  const { id, name, email, qtt, metadata } = record;

  const emailHtml = `<!DOCTYPE html>${ReactDOMServer.renderToStaticMarkup(
    <ADVEmailTemplate
      registrationId={String(id)}
      nome={name}
      email={email}
      quantity={qtt}
      kids={record.kids}
      totalPrice={formatPrice(metadata.totalPrice)}
    />
  )}`;

  const emailFrom = process.env.EMAIL_FROM || "contato@igrejasv.com";
  const mailOptions = {
    from: `AD 2026 <${emailFrom}>`,
    to: email,
    subject: 'Confirmação de Compra - AD 2026',
    html: emailHtml,
  };

  return await transporter.sendMail(mailOptions);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // This allows manual trigger via API if needed
    // Expects IscritoRecord in body
    await sendIsvRunEmail(req.body);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Error sending email' });
  }
}
