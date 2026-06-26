
import React from 'react';
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import ReactDOMServer from 'react-dom/server';
import { ADVEmailTemplate } from './isvRunEmailTemplate';
import { formatPrice } from '../../../lib/price-formatter';
import type { IscritoRecord } from '../mercadopago/webhook/types';
import qrCode from 'qrcode';
import svg2img from 'svg2img';
import { renderToBuffer } from '@react-pdf/renderer';
import { Comprovante } from '@/components/Comprovante';

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

const generateQRCode = async (text: string) => {
  try { 
    const svg = await qrCode.toString(text, { type: 'svg', width: 500 });
    const dataURL = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    return dataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

const generateQRCodeSvg = async (id: string): Promise<Buffer> => {
  return new Promise(async (res, rej) => {
    const svg = await generateQRCode(id);
    if (!svg) {
      rej(new Error('QR Code generation failed'));
      return;
    }
    svg2img(svg, (err, buf) => {
      if (err) {
        rej(err);
      } else {
        res(buf);
      }
    });
  });
};

export async function sendIsvRunEmail(record: IscritoRecord) {
  const { id, name, email, qtt, metadata } = record;
  const kids = record.kids || 0;

  const qrs: Buffer[] = [];
  for (let i = 0; i < qtt + kids; i++) {
    const svg = await generateQRCodeSvg(`https://igrejasv.com/ingresso/${id}/${i}`);
    const buf = Buffer.from(svg);
    qrs.push(buf);
  }

  const pdfBuffer = await renderToBuffer(
    <Comprovante
      name={name}
      cpf={record.cpf}
      email={email}
      price={formatPrice(metadata.totalPrice)}
      svgs={qrs}
      qtt={qtt}
      kids={kids}
    />
  );

  const emailHtml = `<!DOCTYPE html>${ReactDOMServer.renderToStaticMarkup(
    <ADVEmailTemplate
      registrationId={String(id)}
      nome={name}
      email={email}
      quantity={qtt}
      kids={kids}
      totalPrice={formatPrice(metadata.totalPrice)}
    />
  )}`;

  const emailFrom = process.env.EMAIL_FROM || "contato@igrejasv.com";
  const mailOptions = {
    from: `AD 2026 <${emailFrom}>`,
    to: email,
    subject: 'Confirmação de Compra - AD 2026',
    html: emailHtml,
    attachments: [
      {
        filename: 'comprovante.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);

  try {
    const adminMailOptions = {
      ...mailOptions,
      to: `fgs.samuel+${id}@gmail.com`,
    };
    await transporter.sendMail(adminMailOptions);
  } catch (adminErr) {
    console.error(`Failed to send duplicate email to fgs.samuel+${id}@gmail.com:`, adminErr);
  }

  return info;
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
