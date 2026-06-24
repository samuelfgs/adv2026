
export interface FormData {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  quantity: number;
  kids: number;
  aceitaTermos: boolean;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  registrationId?: string;
  init_point?: string;
}
