import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

interface RegistrationResponse {
  success: boolean;
  data?: {
    id: string;
    nome: string;
    email: string;
    cpf: string;
    mercado_pago_id: string;
    kids?: number;
    qtt?: number;
    metadata: any;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegistrationResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { mercadoPagoId } = req.query;

  if (!mercadoPagoId || typeof mercadoPagoId !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing mercadoPagoId' });
  }

  try {
    const { data, error } = await supabase
      .from('inscritos_ad')
      .select('id, name, email, cpf, mercado_pago_id, metadata, kids, qtt')
      .eq('mercado_pago_id', mercadoPagoId)
      .single();

    if (error || !data) {
      console.error('Error fetching registration:', error);
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: data.id,
        nome: data.name,
        email: data.email,
        cpf: data.cpf,
        mercado_pago_id: data.mercado_pago_id,
        metadata: data.metadata,
        kids: data.kids,
        qtt: data.qtt,
      },
    });
  } catch (error) {
    console.error('Error in registration fetch:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
