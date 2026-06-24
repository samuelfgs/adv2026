import type { NextApiRequest, NextApiResponse } from "next";
import { Preference } from "mercadopago";
import { client } from "@/lib/mercadopago";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { inscritosAd } from "@/lib/db/schema";

const PRICE = 0.01; // Test price of 0.01 BRL

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nome, email, cpf, telefone, quantity, kids } = req.body;

    if (!nome || !email || !cpf || !telefone || !quantity) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const kidsCount = parseInt(kids) || 0;

    const mercadoPagoId = nanoid() + nanoid();
    const preference = new Preference(client);

    const mercadoPagoBody = {
      items: [
        {
          id: "AD2026-TICKET-TEST",
          title: `[TESTE] AD 2026 - Conferência Adoração e Discipulado`,
          description: `Inscrição de Teste para a Conferência AD 2026`,
          quantity: parseInt(quantity),
          currency_id: "BRL",
          unit_price: PRICE,
        }
      ],
      payer: {
        name: nome,
        email: email,
      },
      external_reference: mercadoPagoId,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_ENDPOINT}/success`,
        failure: `${process.env.NEXT_PUBLIC_ENDPOINT}/`,
        pending: `${process.env.NEXT_PUBLIC_ENDPOINT}/`,
      },
      auto_return: "approved" as const,
      notification_url: `${process.env.NEXT_PUBLIC_ENDPOINT}/api/mercadopago/webhook/`,
    };

    let mercadoPagoResponse;
    try {
      mercadoPagoResponse = await preference.create({ body: mercadoPagoBody });
    } catch (error: any) {
      console.error('MercadoPago error:', error);
      return res.status(500).json({ error: 'Erro ao criar preferência de pagamento' });
    }

    const insertData = {
      name: nome,
      cpf: cpf,
      email: email,
      telefone: telefone,
      mercadoPagoId: mercadoPagoId,
      metadata: {
        payer: {
          nome,
          cpf,
          email,
          telefone,
        },
        qtt: parseInt(quantity),
        kids: kidsCount,
        basePrice: PRICE,
        totalPrice: parseInt(quantity) * PRICE,
        event: "AD 2026 TEST",
        init_point: mercadoPagoResponse.init_point
      },
      qtt: parseInt(quantity),
      kids: kidsCount
    };

    try {
      const result = await db.insert(inscritosAd).values(insertData).returning();

      return res.status(201).json({
        success: true,
        data: result,
        init_point: mercadoPagoResponse.init_point
      });
    } catch (error: any) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Erro ao salvar inscrição no banco de dados' });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
