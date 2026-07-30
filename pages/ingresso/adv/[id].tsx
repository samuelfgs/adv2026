import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function IngressoAdvRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (router.isReady && id) {
      router.replace(`/checkin/${id}`);
    }
  }, [router.isReady, id]);

  return (
    <>
      <Head>
        <title>Redirecionando Check-in... | AD 2026</title>
      </Head>
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-bold text-white">Validando QR Code...</p>
        <p className="text-xs text-slate-400 mt-1">Redirecionando para o sistema de check-in...</p>
      </div>
    </>
  );
}
