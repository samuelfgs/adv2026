import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    fontSize: "14px",
    fontWeight: "light",
  },
  section: {
    margin: 15,
    padding: 15,
    textAlign: "center",
    gap: 15,
  },
});

interface ComprovanteADVProps {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  quantity: number;
  qrCodeSvg: any;
}

export const ComprovanteADV = (props: ComprovanteADVProps) => {
  const { nome, cpf, email, quantity, qrCodeSvg, telefone } = props;
  const idx = email.indexOf("@");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Voucher de Inscrição</Text>
          <View style={{ display: "flex", gap: 15 }}>
            <View style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#F29100' }}>AD 2026</Text>
              <Text style={{ color: "#8d8d8d" }}>Igreja em São Vicente - Conferência Adoração e Discipulado</Text>
            </View>

            <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-around", gap: 15, marginTop: 10, marginBottom: 10 }}>
              <View style={{ display: "flex", flexDirection: "column", justifyContent: "center", lineHeight: 1.5 }}>
                <Text style={{ fontWeight: 'bold' }}>31 Jul - 02 Ago, 2026</Text>
              </View>
              <View style={{ display: "flex", flexDirection: "column", lineHeight: 1.5 }}>
                <Text style={{ fontWeight: 'bold' }}>ISV São Vicente</Text>
                <Text>São Vicente, SP</Text>
              </View>
            </View>

            <View style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
              <View style={{ display: "flex", lineHeight: 1.5 }}>
                <Text style={{ color: "#8d8d8d" }}>Comprador</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{nome}</Text>
                <Text style={{ fontSize: 12 }}>CPF: {cpf.slice(0, 3) + "*******" + cpf.slice(-2)}</Text>
                <Text style={{ fontSize: 12 }}>E-mail: {email.slice(0, 3) + "******" + email.slice(idx - 1)}</Text>
                <Text style={{ fontSize: 12 }}>Tel: {telefone}</Text>
              </View>

              <View style={{ width: '100%', padding: 15, backgroundColor: '#fff9f0', borderRadius: 10, border: '1px solid #F29100' }}>
                <Text style={{ color: '#F29100', fontWeight: 'bold' }}>ITENS DO PEDIDO</Text>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text>Passaporte AD 2026</Text>
                  <Text style={{ fontWeight: 'bold' }}>{quantity}x</Text>
                </View>
              </View>

              <View style={{ display: "flex", alignItems: "center", width: '100%', marginTop: 20 }}>
                <Text style={{ fontSize: 10, color: '#8d8d8d', marginBottom: 10 }}>QR CODE DE ACESSO</Text>
                <Image source={qrCodeSvg} style={{ width: 180, height: 180 }} />
                <Text style={{ fontSize: 10, color: '#8d8d8d', marginTop: 10 }}>Válido para {quantity} entrada(s)</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
