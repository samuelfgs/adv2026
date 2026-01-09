import type { NextApiRequest, NextApiResponse } from 'next';
import { payment } from '@/lib/mercadopago';
import { supabase } from '@/lib/supabase';
import { verifyWebhookSignature } from '@/lib/webhook-verification';
import { sendIsvRunEmail } from '../email/sendIsvRunEmail';
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

    const { id, topic } = req.query;

    console.log('Webhook received:', {
      query: req.query,
      body: req.body,
    });

    // Only process payment notifications
    if (topic !== 'payment') {
      console.log('Ignoring non-payment webhook:', topic);
      return res.status(200).json({
        success: true,
        message: 'Webhook received but not a payment notification'
      });
    }

    const paymentId = id as string;

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

    const { data: inscrito, error: dbError } = await supabase
      .from('inscritos')
      .select('*')
      .eq('mercado_pago_id', externalReference)
      .single();

    if (dbError || !inscrito) {
      console.error('Registration not found for external_reference:', externalReference, dbError);
      return res.status(404).json({
        success: false,
        paymentId,
        message: 'Registration not found for this payment'
      });
    }

    const inscritoRecord = inscrito as IscritoRecord;

    // Check if email already sent (idempotency)
    // if (inscritoRecord.email_sent) {
    //   console.log('Email already sent for registration:', inscritoRecord.id);
    //   return res.status(200).json({
    //     success: true,
    //     paymentId,
    //     inscritoId: inscritoRecord.id,
    //     message: 'Email already sent for this registration',
    //     alreadySent: true
    //   });
    // }

    try {
      await sendIsvRunEmail(inscritoRecord);
      console.log('Confirmation email sent successfully to:', inscritoRecord.email);
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      return res.status(500).json({
        success: false,
        paymentId,
        inscritoId: inscritoRecord.id,
        message: 'Failed to send confirmation email'
      });
    }

    // Update database to mark email as sent
    const { error: updateError } = await supabase
      .from('inscritos')
      .update({ email_sent: true })
      .eq('id', inscritoRecord.id);

    if (updateError) {
      console.error('Error updating email_sent flag:', updateError);
      // Email was sent, but flag update failed - log but don't fail the request
      // This prevents resending if webhook is retried
      return res.status(500).json({
        success: false,
        paymentId,
        inscritoId: inscritoRecord.id,
        message: 'Email sent but failed to update database'
      });
    }

    console.log('Webhook processed successfully for registration:', inscritoRecord.id);

    // Success response
    return res.status(200).json({
      success: true,
      paymentId,
      inscritoId: inscritoRecord.id,
      message: 'Confirmation email sent successfully'
    });

  } catch (error: any) {
    console.error('Unexpected error in webhook handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
