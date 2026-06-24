import { MercadoPagoConfig, Payment } from "mercadopago";

export const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

export const payment = new Payment(client);
