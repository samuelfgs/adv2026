import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { checkin, inscritosAd } from '@/lib/db/schema';
import { supabase } from '@/lib/supabase';
import { eq, and } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { inscricaoId, inscricaoNumber = 0, action = 'checkin', responsavel = 'Admin Manual' } = req.body;

  if (!inscricaoId) {
    return res.status(400).json({ success: false, error: 'Inscricao ID is required' });
  }

  const numInscricaoId = Number(inscricaoId);
  const numEntry = Number(inscricaoNumber);

  const EXCLUDED_IDS = ['7', '8', '9'];
  if (EXCLUDED_IDS.includes(String(numInscricaoId))) {
    return res.status(404).json({ success: false, error: 'Inscrição não encontrada' });
  }

  try {
    // Verify that registration exists and is paid
    let registration: any = null;
    try {
      if (db) {
        const results = await db.select().from(inscritosAd).where(eq(inscritosAd.id, numInscricaoId)).limit(1);
        if (results.length > 0) registration = results[0];
      }
    } catch (e) {
      console.warn('Drizzle check reg failed:', e);
    }

    if (!registration) {
      const { data: supaReg } = await supabase.from('inscritos_ad').select('*').eq('id', numInscricaoId).limit(1);
      if (supaReg && supaReg.length > 0) registration = supaReg[0];
    }

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Inscrição não encontrada' });
    }

    const isPaid =
      registration.paymentStatus === 'approved' ||
      registration.emailSent === true ||
      registration.payment_status === 'approved' ||
      registration.email_sent === true;

    if (!isPaid) {
      return res.status(403).json({ success: false, error: 'Pagamento não confirmado para esta inscrição.' });
    }
    if (action === 'checkout') {
      // Perform undo checkin (delete record)
      try {
        if (db) {
          await db.delete(checkin).where(
            and(
              eq(checkin.inscricaoId, numInscricaoId),
              eq(checkin.inscricaoNumber, numEntry)
            )
          );
        }
      } catch (err) {
        console.warn('Drizzle delete failed:', err);
      }

      try {
        await supabase
          .from('checkin')
          .delete()
          .eq('inscricao_id', numInscricaoId)
          .eq('inscricao_number', numEntry);
      } catch (err) {
        console.warn('Supabase delete failed:', err);
      }

      return res.status(200).json({
        success: true,
        message: 'Check-in cancelado com sucesso',
        action: 'checkout',
        inscricaoId: numInscricaoId,
        inscricaoNumber: numEntry,
      });
    }

    // Action: Check-in (mark as read)
    // First, check if already checked in
    let existingCheckin: any = null;

    try {
      if (db) {
        const existing = await db
          .select()
          .from(checkin)
          .where(
            and(
              eq(checkin.inscricaoId, numInscricaoId),
              eq(checkin.inscricaoNumber, numEntry)
            )
          )
          .limit(1);
        if (existing.length > 0) {
          existingCheckin = existing[0];
        }
      }
    } catch (err) {
      console.warn('Drizzle check failed, trying Supabase:', err);
    }

    if (!existingCheckin) {
      const { data: supaCheckin } = await supabase
        .from('checkin')
        .select('*')
        .eq('inscricao_id', numInscricaoId)
        .eq('inscricao_number', numEntry)
        .limit(1);

      if (supaCheckin && supaCheckin.length > 0) {
        existingCheckin = {
          id: supaCheckin[0].id,
          createdAt: supaCheckin[0].created_at,
          inscricaoId: supaCheckin[0].inscricao_id,
          inscricaoNumber: supaCheckin[0].inscricao_number,
          responsavel: supaCheckin[0].responsavel,
        };
      }
    }

    if (existingCheckin) {
      return res.status(200).json({
        success: true,
        isNew: false,
        message: 'QR Code / Inscrição já possui check-in realizado!',
        checkin: existingCheckin,
      });
    }

    // Insert new checkin
    let newRecord: any = null;
    try {
      if (db) {
        const inserted = await db
          .insert(checkin)
          .values({
            inscricaoId: numInscricaoId,
            inscricaoNumber: numEntry,
            responsavel: responsavel,
          })
          .returning();
        if (inserted && inserted.length > 0) {
          newRecord = inserted[0];
        }
      }
    } catch (err) {
      console.warn('Drizzle insert failed, trying Supabase:', err);
    }

    if (!newRecord) {
      const { data: supaInserted, error: supaErr } = await supabase
        .from('checkin')
        .insert({
          inscricao_id: numInscricaoId,
          inscricao_number: numEntry,
          responsavel: responsavel,
        })
        .select();

      if (supaErr) {
        throw supaErr;
      }
      if (supaInserted && supaInserted.length > 0) {
        newRecord = {
          id: supaInserted[0].id,
          createdAt: supaInserted[0].created_at,
          inscricaoId: supaInserted[0].inscricao_id,
          inscricaoNumber: supaInserted[0].inscricao_number,
          responsavel: supaInserted[0].responsavel,
        };
      }
    }

    return res.status(200).json({
      success: true,
      isNew: true,
      message: 'Check-in realizado com sucesso!',
      checkin: newRecord,
    });
  } catch (error: any) {
    console.error('Error marking check-in:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
