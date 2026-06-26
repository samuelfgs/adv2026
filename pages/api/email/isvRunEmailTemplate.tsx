
import React from 'react';

interface EmailTemplateProps {
  registrationId: string;
  nome: string;
  email: string;
  quantity: number;
  totalPrice: string;
  kids?: number;
}

export const ADVEmailTemplate: React.FC<EmailTemplateProps> = ({
  registrationId,
  nome,
  quantity,
  totalPrice,
  kids,
}) => (
  <div style={{
    fontFamily: 'sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#ffffff',
    color: '#333333'
  }}>
    <div style={{
      textAlign: 'center',
      padding: '40px 0',
      backgroundColor: '#000000',
      borderRadius: '20px 20px 0 0'
    }}>
      <h1 style={{ color: '#F29100', margin: 0, fontSize: '32px' }}>AD 2026</h1>
      <p style={{ color: '#ffffff', margin: '10px 0 0 0', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px' }}>
        Conferência Adoração e Discipulado
      </p>
    </div>

    <div style={{ padding: '40px 20px', border: '1px solid #eeeeee', borderRadius: '0 0 20px 20px' }}>
      <h2 style={{ fontSize: '24px', margin: '0 0 20px 0' }}>Sua compra foi confirmada!</h2>
      <p>Olá <strong>{nome}</strong>,</p>
      <p>Recebemos seu pagamento para a conferência <strong>AD 2026 - Adoração, Discipulado e a estratégia de Jesus</strong>.</p>

      <div style={{ backgroundColor: '#fff9f0', padding: '20px', borderRadius: '15px', marginTop: '30px' }}>
        <h3 style={{ fontSize: '18px', color: '#F29100', margin: '0 0 15px 0' }}>Resumo do Pedido</h3>
        <p style={{ margin: '5px 0' }}><strong>ID do Pedido:</strong> {registrationId}</p>
        <p style={{ margin: '5px 0' }}><strong>Quantidade:</strong> {quantity} {quantity === 1 ? 'ingresso' : 'ingressos'}</p>
        {kids && kids > 0 ? (
          <p style={{ margin: '5px 0' }}><strong>Crianças (3-10 anos):</strong> {kids} {kids === 1 ? 'criança' : 'crianças'}</p>
        ) : null}
        <p style={{ margin: '5px 0' }}><strong>Valor Total:</strong> {totalPrice}</p>
        <p style={{ margin: '5px 0' }}><strong>Data:</strong> 31 Julho a 02 Agosto</p>
        <p style={{ margin: '5px 0' }}><strong>Local:</strong> ISV São Vicente</p>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#666666' }}>
          Seu voucher e QR Code de acesso também estão disponíveis no <strong>arquivo PDF anexo</strong> a este e-mail.
        </p>
        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Apresente seu QR Code na entrada do evento.</p>
      </div>
    </div>

    <div style={{ textAlign: 'center', marginTop: '30px', color: '#999999', fontSize: '12px' }}>
      <p>Igreja em São Vicente - ISV</p>
      <p>Rua Jardel França, 18 - São Vicente/SP</p>
    </div>
  </div>
);
