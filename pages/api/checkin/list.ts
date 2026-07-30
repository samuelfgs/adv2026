import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { inscritosAd, checkin } from '@/lib/db/schema';
import { supabase } from '@/lib/supabase';
import { desc, or, eq } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let rawInscritos: any[] = [];
    let checkins: any[] = [];

    // Try Drizzle first (Filter for paid registrations: approved or emailSent)
    try {
      if (db) {
        rawInscritos = await db
          .select()
          .from(inscritosAd)
          .where(
            or(
              eq(inscritosAd.paymentStatus, 'approved'),
              eq(inscritosAd.emailSent, true)
            )
          )
          .orderBy(desc(inscritosAd.createdAt));
          
        checkins = await db.select().from(checkin).orderBy(desc(checkin.createdAt));
      }
    } catch (drizzleErr) {
      console.warn('Drizzle fetch failed, falling back to Supabase:', drizzleErr);
    }

    // Fallback to Supabase if Drizzle failed or returned empty
    if (rawInscritos.length === 0) {
      const { data: inscritosData, error: inscritosErr } = await supabase
        .from('inscritos_ad')
        .select('*')
        .or('payment_status.eq.approved,email_sent.eq.true')
        .order('created_at', { ascending: false });

      if (!inscritosErr && inscritosData) {
        rawInscritos = inscritosData.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          cpf: item.cpf,
          telefone: item.telefone,
          qtt: item.qtt,
          kids: item.kids,
          mercadoPagoId: item.mercado_pago_id,
          paymentStatus: item.payment_status,
          emailSent: item.email_sent,
          metadata: item.metadata,
          createdAt: item.created_at,
        }));
      }

      const { data: checkinData, error: checkinErr } = await supabase
        .from('checkin')
        .select('*')
        .order('created_at', { ascending: false });

      if (!checkinErr && checkinData) {
        checkins = checkinData.map((item) => ({
          id: item.id,
          createdAt: item.created_at,
          inscricaoId: item.inscricao_id,
          inscricaoNumber: item.inscricao_number,
          responsavel: item.responsavel,
        }));
      }
    }

    // Exclude specific test/invalid IDs (#7, #8, #9) and keep only paid signups
    const EXCLUDED_IDS = ['7', '8', '9'];

    const inscritos = rawInscritos.filter((person) => {
      const pId = String(person.id);
      if (EXCLUDED_IDS.includes(pId)) return false;

      const pStatus = person.paymentStatus || person.payment_status;
      const isSent = person.emailSent ?? person.email_sent;
      return pStatus === 'approved' || isSent === true;
    });

    // Process checkin status per participant
    const checkinMap: Record<string, any[]> = {};
    checkins.forEach((c) => {
      const key = String(c.inscricaoId);
      if (!checkinMap[key]) checkinMap[key] = [];
      checkinMap[key].push(c);
    });

    let totalAdults = 0;
    let totalKids = 0;
    let totalCheckedInPeople = 0;

    const list = inscritos.map((person) => {
      const pId = String(person.id);
      const personCheckins = checkinMap[pId] || [];
      const qtt = person.qtt || 1;
      const kids = person.kids || 0;
      const totalTickets = qtt + kids;

      totalAdults += qtt;
      totalKids += kids;
      totalCheckedInPeople += personCheckins.length;

      const isFullyCheckedIn = personCheckins.length >= totalTickets;
      const isPartiallyCheckedIn = personCheckins.length > 0 && personCheckins.length < totalTickets;

      return {
        id: pId,
        name: person.name,
        email: person.email,
        cpf: person.cpf,
        telefone: person.telefone,
        qtt,
        kids,
        totalTickets,
        mercadoPagoId: person.mercadoPagoId || person.mercado_pago_id,
        paymentStatus: person.paymentStatus || person.payment_status || 'approved',
        createdAt: person.createdAt,
        checkins: personCheckins,
        checkinCount: personCheckins.length,
        isFullyCheckedIn,
        isPartiallyCheckedIn,
        status: isFullyCheckedIn ? 'checked_in' : isPartiallyCheckedIn ? 'partial' : 'pending',
      };
    });

    const totalPeople = totalAdults + totalKids;
    const totalPendingPeople = Math.max(0, totalPeople - totalCheckedInPeople);

    return res.status(200).json({
      success: true,
      stats: {
        totalRegistrations: list.length,
        totalPeople,
        totalAdults,
        totalKids,
        totalCheckedInPeople,
        totalPendingPeople,
        completionPercentage: totalPeople > 0 ? Math.round((totalCheckedInPeople / totalPeople) * 100) : 0,
      },
      data: list,
    });
  } catch (error: any) {
    console.error('Error in checkin list handler:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
