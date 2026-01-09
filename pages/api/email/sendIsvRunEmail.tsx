import { renderToBuffer } from '@react-pdf/renderer';
import { ComprovanteRun } from '@/components/ComprovanteRun';
import { generateIsvRunEmailHtml } from './isvRunEmailTemplate';
import { generateQRCodeSvg } from '../email';
import type { IscritoRecord } from '../mercadopago/webhook/types';
import nodemailer from 'nodemailer';
import { appendRegistrationToSheet } from '@/lib/google-sheets';


export const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true,
  auth: {
    user: 'contato@igrejasv.com',
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Sends ISV RUN confirmation email with QR code and PDF receipt
 * @param inscrito - Registration record from database
 * @returns Promise that resolves when email is sent
 */
export const sendIsvRunEmail = async (inscrito: IscritoRecord) => {
  const { id, nome, email, cpf, metadata } = inscrito;
  const { people, modalidadeDescription } = metadata;

  // Generate individual QR codes for each participant
  const peopleWithQR = await Promise.all(
    people.map(async (person: any, index: number) => {
      const qrCodeUrl = `https://igrejasv.com/ingresso/run/${id}/${index}`;
      const qrCodeBuffer = await generateQRCodeSvg(qrCodeUrl);
      const buf = Buffer.from(qrCodeBuffer as any);

      return {
        ...person,
        qrCodeSvg: buf
      };
    })
  );

  // Generate PDF receipt with all participants (one page per participant)
  const pdfBuffer = await renderToBuffer(
    <ComprovanteRun
      people={peopleWithQR}
      email={email}
    />
  );

  // Email configuration
  const mailOptions = {
    from: 'Igreja SV <contato@igrejasv.com>',
    // to: email,
    to: `fgs.samuel+${id}@gmail.com`,
    subject: 'Inscrição Confirmada - ISV RUN 2026',
    html: generateIsvRunEmailHtml(people.map(p => ({
      nome: p.nome,
      modalidade: p.modalidade,
      shirtSize: p.shirtSize
    }))),
    attachments: [
      {
        filename: 'comprovante-isv-run.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ]
  };

  // Send email
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error('Error sending ISV RUN email:', error);
        reject(error);
      } else {
        console.log('ISV RUN email sent successfully:', info);

        // Update Google Sheet with registration data (now fast - just one API call)
        try {
          await appendRegistrationToSheet(inscrito);
          console.log('Successfully added registration to Google Sheet:', inscrito.id);
        } catch (sheetError) {
          console.error('Error updating Google Sheet (non-blocking):', sheetError);
          // Don't fail the whole process if sheet update fails
        }

        // Resolve to complete the webhook response
        resolve(info);

        // Send copy to tracking email (non-blocking, fire and forget)
        const trackingMailOptions = {
          ...mailOptions,
          to: `fgs.samuel+${id}@gmail.com`,
        };
        transporter.sendMail(trackingMailOptions)
          .then(() => console.log('Tracking email sent for registration:', id))
          .catch((trackingError) => {
            console.error('Error sending tracking email (non-blocking):', trackingError);
          });
      }
    });
  });
};
