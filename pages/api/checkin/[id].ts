import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { inscritosAd, checkin } from '@/lib/db/schema';
import { supabase } from '@/lib/supabase';
import { eq, and } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id, entry = '0', autoMark = 'true', responsavel = 'Leitor QR Code' } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing registration ID' });
  }

  const numId = Number(id);
  const numEntry = Number(entry);

  const EXCLUDED_IDS = ['7', '8', '9'];
  if (EXCLUDED_IDS.includes(String(numId))) {
    return res.status(404).json({ success: false, error: 'Inscrição não encontrada' });
  }

  try {
    let registration: any = null;

    // 1. Fetch Registration
    try {
      if (db) {
        const results = await db
          .select()
          .from(inscritosAd)
          .where(eq(inscritosAd.id, numId))
          .limit(1);
        if (results.length > 0) registration = results[0];
      }
    } catch (err) {
      console.warn('Drizzle registration fetch error, using Supabase:', err);
    }

    if (!registration) {
      const { data: supaReg } = await supabase
        .from('inscritos_ad')
        .select('*')
        .eq('id', numId)
        .limit(1);
      if (supaReg && supaReg.length > 0) {
        registration = {
          id: supaReg[0].id,
          name: supaReg[0].name,
          email: supaReg[0].email,
          cpf: supaReg[0].cpf,
          telefone: supaReg[0].telefone,
          qtt: supaReg[0].qtt,
          kids: supaReg[0].kids,
          mercadoPagoId: supaReg[0].mercado_pago_id,
          paymentStatus: supaReg[0].payment_status,
          createdAt: supaReg[0].created_at,
          metadata: supaReg[0].metadata,
        };
      }
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
      return res.status(403).json({ success: false, error: 'Pagamento não confirmado. Apenas inscrições pagas podem realizar check-in.' });
    }

    // 2. Fetch Checkin History for this Registration
    let checkinList: any[] = [];
    try {
      if (db) {
        checkinList = await db
          .select()
          .from(checkin)
          .where(eq(checkin.inscricaoId, numId));
      }
    } catch (err) {
      console.warn('Drizzle checkin fetch error:', err);
    }

    if (checkinList.length === 0) {
      const { data: supaCheckins } = await supabase
        .from('checkin')
        .select('*')
        .eq('inscricao_id', numId);
      if (supaCheckins) {
        checkinList = supaCheckins.map((item) => ({
          id: item.id,
          createdAt: item.created_at,
          inscricaoId: item.inscricao_id,
          inscricaoNumber: item.inscricao_number,
          responsavel: item.responsavel,
        }));
      }
    }

    const currentEntryCheckin = checkinList.find(c => Number(c.inscricaoNumber) === numEntry);
    let isNew = false;
    let finalCheckin = currentEntryCheckin;

    // 3. Auto mark check-in if requested and not yet checked in
    if (autoMark === 'true' && !currentEntryCheckin) {
      const respName = typeof responsavel === 'string' ? responsavel : 'Leitor QR Code';
      
      let insertedRecord: any = null;
      try {
        if (db) {
          const inserted = await db
            .insert(checkin)
            .values({
              inscricaoId: numId,
              inscricaoNumber: numEntry,
              responsavel: respName,
            })
            .returning();
          if (inserted && inserted.length > 0) insertedRecord = inserted[0];
        }
      } catch (err) {
        console.warn('Drizzle insert checkin error:', err);
      }

      if (!insertedRecord) {
        const { data: supaIns } = await supabase
          .from('checkin')
          .insert({
            inscricao_id: numId,
            inscricao_number: numEntry,
            responsavel: respName,
          })
          .select();
        if (supaIns && supaIns.length > 0) {
          insertedRecord = {
            id: supaIns[0].id,
            createdAt: supaIns[0].created_at,
            inscricaoId: supaIns[0].inscricao_id,
            inscricaoNumber: supaIns[0].inscricao_number,
            responsavel: supaIns[0].responsavel,
          };
        }
      }

      if (insertedRecord) {
        isNew = true;
        finalCheckin = insertedRecord;
        checkinList.push(insertedRecord);
      }
    }

    const totalTickets = (registration.qtt || 1) + (registration.kids || 0);
    const ticketType = numEntry >= (registration.qtt || 1) ? 'Ingresso Criança' : 'Ingresso Adulto';

    return res.status(200).json({
      success: true,
      isNew,
      registration: {
        id: String(registration.id),
        name: registration.name,
        email: registration.email,
        cpf: registration.cpf,
        telefone: registration.telefone,
        qtt: registration.qtt || 1,
        kids: registration.kids || 0,
        totalTickets,
        paymentStatus: registration.paymentStatus || 'pending',
        createdAt: registration.createdAt,
      },
      currentEntry: {
        entryNumber: numEntry,
        ticketType,
        checkin: finalCheckin || null,
        isCheckedIn: !!finalCheckin,
      },
      allCheckins: checkinList,
    });
  } catch (error: any) {
    console.error('Error fetching checkin details:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
