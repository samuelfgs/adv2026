import * as React from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import { ColorRing } from "react-loader-spinner";
import { ToastContainer, toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import 'react-toastify/dist/ReactToastify.css';

function Ingresso() {
  const router = useRouter();
  const { id, entry } = router.query;
  const queryClient = useQueryClient();

  const [info, setInfo] = React.useState<any>();
  const [isNew, setIsNew] = React.useState(0);
  const [notAuthorized, setNotAuthorized] = React.useState(false);
  const [notPaid, setNotPaid] = React.useState(true);

  // Fetch checkin data
  const { data: checkinData = [], isLoading: isLoadingCheckin, error: checkinError } = useQuery({
    queryKey: ['checkin', id, entry],
    queryFn: async () => {
      if (!id || !entry) return [];
      let query = supabase.from("checkin").select();
      query = query.filter("inscricao_id", "eq", id);
      query = query.filter("inscricao_number", "eq", entry);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!entry,
  });

  // Fetch inscricao data
  const { data: inscricaoData = [], isLoading: isLoadingInscricao, error: inscricaoError } = useQuery({
    queryKey: ['inscricao', id],
    queryFn: async () => {
      if (!id) return [];
      let query = supabase.from("inscritos_ad").select();
      query = query.filter("id", "eq", id);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch payment data
  const { data: paymentData = [], isLoading: isLoadingPayment, error: paymentError } = useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      if (!id) return [];
      let query = supabase.from("payments").select();
      query = query.filter("user_id", "eq", id);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Mutation for creating checkin
  const checkinMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from("checkin").insert({
        inscricao_id: id,
        inscricao_number: entry,
        responsavel: name,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin', id, entry] });
      setIsNew(1);
    },
  });

  // Handle checkin logic
  React.useEffect(() => {
    const processCheckin = async () => {
      if (!checkinData || !inscricaoData || !paymentData) {
        return;
      }

      const name = localStorage.getItem("isv-admin");
      if (!name) {
        setNotAuthorized(true);
        return;
      }

      if (inscricaoData.length === 0 || (+(entry ?? 0)) >= inscricaoData[0].qtt + inscricaoData[0].kids) {
        setNotAuthorized(true);
        return;
      }

      if (paymentData.length === 0) {
        setNotPaid(false);
        return;
      }

      if (checkinData.length === 0) {
        checkinMutation.mutate(name);
      } else if (checkinData.length === 1) {
        setIsNew((prev) => !prev ? 2 : prev);
        const date = new Date(checkinData[0].created_at);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        setInfo({
          nome: `${inscricaoData[0].name} (${+(entry ?? 0) + 1} de ${inscricaoData[0].kids + inscricaoData[0].qtt})`,
          data: `${day}/${month}`,
          horario: `${hours}:${minutes}`,
          pessoa: checkinData[0].responsavel,
          tipo: (+(entry ?? 0)) >= inscricaoData[0].qtt ? "Ingresso Criança" : "Ingresso Adulto",
        });
      }
    };

    processCheckin();
  }, [checkinData, inscricaoData, paymentData, entry, id, checkinMutation]);

  // Show toast notifications
  React.useEffect(() => {
    if (isNew === 1) {
      toast.success("CHECK-IN REALIZADO");
    } else if (isNew === 2) {
      toast.error("CHECK-IN JÁ REALIZADO");
    }
  }, [isNew]);

  // Handle errors
  if (checkinError || inscricaoError || paymentError || notAuthorized) {
    return <h1>Not Authorized</h1>;
  }

  // Handle loading
  if (isLoadingCheckin || isLoadingInscricao || isLoadingPayment || checkinMutation.isPending) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ColorRing
          visible={true}
          height="250"
          width="250"
          ariaLabel="color-ring-loading"
          wrapperStyle={{}}
          wrapperClass="color-ring-wrapper"
          colors={['blue', 'blue', 'blue', 'blue', 'blue']}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Ingresso</h1>
      {info && (
        <div>
          <p><strong>Nome:</strong> {info.nome}</p>
          <p><strong>Data:</strong> {info.data}</p>
          <p><strong>Horário:</strong> {info.horario}</p>
          <p><strong>Responsável:</strong> {info.pessoa}</p>
          <p><strong>Tipo:</strong> {info.tipo}</p>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

export default Ingresso;
