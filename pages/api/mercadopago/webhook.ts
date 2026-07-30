import type { NextApiRequest, NextApiResponse } from 'next';
import { payment } from '@/lib/mercadopago';
import { db } from '@/lib/db';
import { inscritosAd } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyWebhookSignature } from '@/lib/webhook-verification';
import { sendIsvRunEmail } from '../email/sendIsvRunEmail';
import { appendRegistrationToSheet } from '@/lib/google-sheets';
import type { WebhookPayload, IscritoRecord, WebhookResponse } from './webhook/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WebhookResponse>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const startTime = Date.now();

  try {
    // // Extract webhook headers
    // const signature = req.headers['x-signature'] as string;
    // const requestId = req.headers['x-request-id'] as string;

    // // Verify webhook signature for security
    // const webhookSecret = process.env.WEBHOOK_SECRET;
    // if (!webhookSecret) {
    //   console.error('WEBHOOK_SECRET environment variable not set');
    //   return res.status(500).json({
    //     success: false,
    //     message: 'Server configuration error'
    //   });
    // }

    // if (!signature || !requestId) {
    //   console.warn('Missing webhook signature or request ID');
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Missing required webhook headers'
    //   });
    // }

    // // Verify signature
    // const rawBody = JSON.stringify(req.body);
    // const isValid = verifyWebhookSignature(rawBody, signature, requestId, webhookSecret);

    // if (!isValid) {
    //   console.warn('Invalid webhook signature detected');
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Invalid webhook signature'
    //   });
    // }

    const paymentId = (
      (req.query.id as string) ||
      (req.query['data.id'] as string) ||
      req.body?.data?.id?.toString() ||
      req.body?.id?.toString()
    );

    const eventType = (
      (req.query.topic as string) ||
      (req.query.type as string) ||
      req.body?.type ||
      req.body?.action
    );

    console.log('[WEBHOOK] Received:', {
      paymentId,
      eventType,
      query: req.query,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Only process payment notifications ('payment', 'payment.created', 'payment.updated', or missing topic if paymentId exists)
    const isPaymentTopic = !eventType || eventType === 'payment' || eventType.startsWith('payment');

    if (!paymentId || !isPaymentTopic) {
      console.log('Ignoring non-payment webhook or missing payment ID:', { eventType, paymentId });
      return res.status(200).json({
        success: true,
        message: 'Webhook received but not a payment notification or missing payment ID'
      });
    }

    // Fetch payment details from Mercado Pago
    let paymentDetails;
    try {
      paymentDetails = await payment.get({ id: paymentId });
    } catch (error: any) {
      console.error('Error fetching payment from Mercado Pago:', error);
      return res.status(404).json({
        success: false,
        paymentId,
        message: 'Payment not found in Mercado Pago'
      });
    }

    console.log('Payment details:', {
      id: paymentDetails.id,
      status: paymentDetails.status,
      external_reference: paymentDetails.external_reference
    });

    // Only process approved payments
    if (paymentDetails.status !== 'approved') {
      console.log('Payment not approved, ignoring:', paymentDetails.status);
      return res.status(200).json({
        success: true,
        message: `Payment status is ${paymentDetails.status}, not sending email`
      });
    }

    // Query database for registration using external_reference
    const externalReference = paymentDetails.external_reference;
    if (!externalReference) {
      console.error('Payment has no external_reference:', paymentId);
      return res.status(400).json({
        success: false,
        paymentId,
        message: 'Payment missing external reference'
      });
    }

    let inscrito;
    try {
      const results = await db
        .select()
        .from(inscritosAd)
        .where(eq(inscritosAd.mercadoPagoId, externalReference))
        .limit(1);
      inscrito = results[0];
    } catch (err: any) {
      console.error('Database query error:', err);
    }

    if (!inscrito) {
      console.error('Registration not found for external_reference:', externalReference);
      return res.status(404).json({
        success: false,
        paymentId,
        message: 'Registration not found for this payment'
      });
    }

    const inscritoRecord: IscritoRecord = {
      id: inscrito.id,
      name: inscrito.name,
      cpf: inscrito.cpf,
      email: inscrito.email,
      telefone: inscrito.telefone || undefined,
      qtt: inscrito.qtt,
      kids: inscrito.kids,
      mercado_pago_id: inscrito.mercadoPagoId || '',
      email_sent: inscrito.emailSent || false,
      metadata: inscrito.metadata as any,
    };

    // ATOMIC CLAIM: Try to update emailSent = true WHERE emailSent = false.
    // If 0 rows are updated, another concurrent webhook request already claimed/processed it.
    let claimed = false;
    try {
      const updatedRows = await db
        .update(inscritosAd)
        .set({ emailSent: true })
        .where(and(eq(inscritosAd.id, inscrito.id), eq(inscritosAd.emailSent, false)))
        .returning();
      claimed = updatedRows.length > 0;
    } catch (err: any) {
      console.error('[WEBHOOK] Error in atomic emailSent update:', err);
    }

    if (!claimed) {
      console.log(`[WEBHOOK] Registration ID ${inscrito.id} already claimed/processed by another request.`);
      return res.status(200).json({
        success: true,
        paymentId,
        inscritoId: inscrito.id,
        message: 'Registration already processed by concurrent request',
        alreadySent: true
      });
    }

    // Send confirmation email
    try {
      const emailStart = Date.now();
      await sendIsvRunEmail(inscritoRecord);
      const emailDuration = Date.now() - emailStart;
      console.log(`[WEBHOOK] Email sent in ${emailDuration}ms to:`, inscritoRecord.email);
    } catch (emailError: any) {
      console.error('[WEBHOOK] Error sending email:', emailError);
    }

    // Automatically append new registration to Google Sheet
    try {
      await appendRegistrationToSheet(inscritoRecord);
      console.log(`[WEBHOOK] ✓ Appended registration to Google Sheet for:`, inscritoRecord.id);
    } catch (sheetError) {
      console.error('[WEBHOOK] Error appending to Google Sheet:', sheetError);
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[WEBHOOK] ✓ Processed successfully in ${totalDuration}ms for registration:`, inscritoRecord.id);

    // Success response
    return res.status(200).json({
      success: true,
      paymentId,
      inscritoId: inscritoRecord.id,
      message: 'Confirmation email sent successfully'
    });

  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`[WEBHOOK] Unexpected error after ${totalDuration}ms:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
