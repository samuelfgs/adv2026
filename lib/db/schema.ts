import {
  pgTable,
  text,
  timestamp,
  bigint,
  boolean,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

export const inscritosAd = pgTable("inscritos_ad", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  name: text("name").notNull(),
  cpf: text("cpf").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone"),
  qtt: integer("qtt").default(1).notNull(),
  kids: integer("kids").default(0).notNull(),
  mercadoPagoId: text("mercado_pago_id"),
  paymentStatus: text("payment_status").default("pending"),
  emailSent: boolean("email_sent").default(false),
  metadata: jsonb("metadata"),
});

export const checkin = pgTable("checkin", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  inscricaoId: bigint("inscricao_id", { mode: "number" }).notNull(),
  inscricaoNumber: integer("inscricao_number").notNull(),
  responsavel: text("responsavel").notNull(),
});

export const payments = pgTable("payments", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  mercadoPagoId: text("mercado_pago_id").notNull(),
  status: text("status").notNull(),
  amount: integer("amount"),
});
