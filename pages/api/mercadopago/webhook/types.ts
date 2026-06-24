export interface WebhookPayload {
  id: string;
  type: string;
  data: {
    id: string;
  };
  action: string;
}

export interface IscritoRecord {
  id: number;
  name: string;
  cpf: string;
  email: string;
  telefone?: string;
  qtt: number;
  kids: number;
  mercado_pago_id: string;
  email_sent: boolean;
  metadata: {
    payer: {
      nome: string;
      cpf: string;
      email: string;
      telefone: string;
    };
    qtt: number;
    kids?: number;
    basePrice: number;
    totalPrice: number;
    event: string;
    init_point: string;
  };
}

export interface WebhookResponse {
  success: boolean;
  paymentId?: string;
  inscritoId?: number;
  message: string;
  alreadySent?: boolean;
}
