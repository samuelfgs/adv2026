
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import ReactDOMServer from 'react-dom/server';
import { ADVEmailTemplate } from './isvRunEmailTemplate';
import { formatPrice } from '../../../lib/price-formatter';
import type { IscritoRecord } from '../mercadopago/webhook/types';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
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

  const mailOptions = {
    from: `AD 2026 <${process.env.EMAIL_FROM}>`,
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
