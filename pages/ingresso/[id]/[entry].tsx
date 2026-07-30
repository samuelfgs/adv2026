import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function IngressoEntryRedirect() {
  const router = useRouter();
  const { id, entry } = router.query;

  useEffect(() => {
    if (router.isReady && id) {
      const entryNum = entry !== undefined ? String(entry) : '0';
      router.replace(`/checkin/${id}?entry=${entryNum}`);
    }
  }, [router.isReady, id, entry]);

  return (
    <>
      <Head>
        <title>Validando Ingresso... | AD 2026</title>
      </Head>
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
        <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-bold text-white">Validando QR Code do Ingresso...</p>
        <p className="text-xs text-slate-400 mt-1">Registrando entrada no sistema de check-in...</p>
      </div>
    </>
  );
}
