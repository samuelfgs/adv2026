import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
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
    const { data: inscrito, error: fetchError } = await supabase
      .from('inscritos_ad')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !inscrito) {
      console.error('Error fetching user:', fetchError);
      return res.status(404).json({ error: 'User not found', details: fetchError?.message });
    }

    // Send email
    try {
      await sendIsvRunEmail(inscrito as IscritoRecord);

      return res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        userId: id,
        email: inscrito.email
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
