import type { NextApiRequest, NextApiResponse } from "next";
import { Preference } from "mercadopago";
import { client } from "@/lib/mercadopago";
import { nanoid } from "nanoid";
import { Modalidade } from "@/types/isv-run";
import { supabase } from "@/lib/supabase";

const PRICE = (+process.env.NEXT_PUBLIC_PRICE! || 60);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, people } = req.body;

    // Validate required fields
    if (!email || !people || !Array.isArray(people) || people.length === 0) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Validate each person
    for (const person of people) {
      if (!person.nome || !person.cpf || !person.dataNascimento || !person.gender || !person.shirtSize || !person.modalidade) {
        return res.status(400).json({ error: 'Dados incompletos para um dos participantes' });
      }
    }

    // Generate unique MercadoPago ID for this registration batch
    const mercadoPagoId = nanoid() + nanoid();

    // Create MercadoPago preference
    const preference = new Preference(client);
    const totalQuantity = people.length;

    // Calculate total price considering elderly discount (50% off)
    const totalPrice = people.reduce((sum: number, person: any) => {
      const personPrice = person.isElderly ? PRICE / 2 : PRICE;
      return sum + personPrice;
    }, 0);

    // Count modalidades for description
    const runCount = people.filter((p: any) => p.modalidade === Modalidade.RUN).length;
    const walkCount = people.filter((p: any) => p.modalidade === Modalidade.WALK).length;
    let modalidadeDescription = '';
    if (runCount > 0 && walkCount > 0) {
      modalidadeDescription = `${runCount} Corrida, ${walkCount} Caminhada`;
    } else if (runCount > 0) {
      modalidadeDescription = `Corrida 5km`;
    } else {
      modalidadeDescription = `Caminhada 5km`;
    }

    // Create individual items for each person to support different prices
    const items = people.map((person: any, index: number) => {
      const personPrice = person.isElderly ? PRICE / 2 : PRICE;
      const modalityText = person.modalidade === Modalidade.RUN ? 'Corrida' : 'Caminhada';
      const elderlyText = person.isElderly ? ' (Idoso - 50% desconto)' : '';

      return {
        id: String(index),
        title: `ISV RUN - ${modalityText}${elderlyText}`,
        description: `Inscrição: ${person.nome} - ISV RUN - Igreja em São Vicente - 07 de Fevereiro`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: personPrice,
      };
    });

    const mercadoPagoBody = {
      items: items,
      payer: {
        name: people[0].nome,
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
      console.error(mercadoPagoBody)
      return res.status(500).json({ error: 'Erro ao criar preferência de pagamento', details: error.message });
    }

    // Insert single registration with all participants in metadata
    const insert = {
      nome: people[0].nome, // Primary registrant name
      cpf: people[0].cpf, // Primary registrant CPF
      email: email,
      mercado_pago_id: mercadoPagoId,
      metadata: {
        people: people.map((person: any) => ({
          nome: person.nome,
          cpf: person.cpf,
          dataNascimento: person.dataNascimento,
          gender: person.gender,
          shirtSize: person.shirtSize,
          modalidade: person.modalidade,
          isElderly: person.isElderly || false,
          price: person.isElderly ? PRICE / 2 : PRICE,
        })),
        basePrice: PRICE,
        totalQuantity: totalQuantity,
        totalPrice: totalPrice,
        runCount: runCount,
        walkCount: walkCount,
        elderlyCount: people.filter((p: any) => p.isElderly).length,
        modalidadeDescription: modalidadeDescription,
        init_point: mercadoPagoResponse.init_point
      }
    };

    const { data, error } = await supabase
      .from('inscritos')
      .insert([insert])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Erro ao salvar inscrição', details: error.message });
    }

    return res.status(201).json({
      success: true,
      data,
      init_point: mercadoPagoResponse.init_point
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}
