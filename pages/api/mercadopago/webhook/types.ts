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
  metadata?: any;
}

export interface WebhookResponse {
  success: boolean;
  paymentId?: string;
  inscritoId?: number;
  message: string;
  alreadySent?: boolean;
}
