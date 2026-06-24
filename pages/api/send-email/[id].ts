import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { inscritosAd } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendIsvRunEmail } from "../email/sendIsvRunEmail";
import type { IscritoRecord } from "../mercadopago/webhook/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch user from database
    let inscrito;
    try {
      const results = await db
        .select()
        .from(inscritosAd)
        .where(eq(inscritosAd.id, parseInt(id)))
        .limit(1);
      inscrito = results[0];
    } catch (err: any) {
      console.error('Error fetching user:', err);
    }

    if (!inscrito) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Map to IscritoRecord
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

    // Send email
    try {
      await sendIsvRunEmail(inscritoRecord);

      return res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        userId: id,
        email: inscritoRecord.email
      });
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      return res.status(500).json({
        error: 'Failed to send email',
        details: emailError.message
      });
    }
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
