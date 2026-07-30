import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CheckinAuthGuard from '@/components/CheckinAuthGuard';

declare global {
  interface Window {
    Html5Qrcode: any;
  }
}

export default function CheckinScannerPage() {
  const router = useRouter();
  const [manualInput, setManualInput] = useState('');
  const [validatorName, setValidatorName] = useState('recepcao');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('checkin_user') || localStorage.getItem('isv-admin') || 'recepcao';
    if (savedName) setValidatorName(savedName);

    // Load Html5Qrcode script from CDN dynamically
    if (window.Html5Qrcode) {
      setScriptLoaded(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => setCameraError('Erro ao carregar módulo da câmera');
      document.body.appendChild(script);
    }
  }, []);

  const parseQrUrl = (input: string): { id: string; entry: string } => {
    const text = input.trim();
    if (text.includes('/ingresso/adv/')) {
      const parts = text.split('/ingresso/adv/')[1]?.split('?')[0]?.split('/') || [];
      return { id: parts[0] || text, entry: parts[1] || '0' };
    }
    if (text.includes('/ingresso/')) {
      const parts = text.split('/ingresso/')[1]?.split('?')[0]?.split('/') || [];
      return { id: parts[0] || text, entry: parts[1] || '0' };
    }
    if (text.includes('/checkin/')) {
      const parts = text.split('/checkin/')[1]?.split('?')[0]?.split('/') || [];
      return { id: parts[0] || text, entry: '0' };
    }
    return { id: text, entry: '0' };
  };

  const handleManualCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    
    const { id: cleanId, entry: cleanEntry } = parseQrUrl(manualInput);
    router.push(`/checkin/${cleanId}?entry=${cleanEntry}&responsavel=${encodeURIComponent(validatorName)}`);
  };

  const startScanner = async () => {
    try {
      setCameraError(null);
      
      if (!window.Html5Qrcode) {
        setCameraError('Carregando leitor de código de barras...');
        return;
      }

      setIsScanning(true);

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new window.Html5Qrcode('qr-reader-container');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          // Successfully scanned QR Code
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current.stop().catch(console.error);
          }
          
          const { id: cleanId, entry: cleanEntry } = parseQrUrl(decodedText);
          router.push(`/checkin/${cleanId}?entry=${cleanEntry}&responsavel=${encodeURIComponent(validatorName)}`);
        },
        (_errorMessage: string) => {
          // frame scan loop
        }
      );
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError('Permissão de câmera negada ou câmera indisponível no dispositivo.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error('Stop error:', err);
      }
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <CheckinAuthGuard>
      <Head>
        <title>Leitor QR Code de Check-in | AD 2026</title>
        <meta name="description" content="Escanear ingressos e QR codes no dia do evento" />
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
        {/* Header */}
        <header className="max-w-xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg">
              AD
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Scanner Check-in</h1>
              <p className="text-xs text-slate-400">Leitor de QR Code para Recepção</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/checkin/control"
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs px-3 py-2 rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5"
            >
              📊 Painel
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('checkin_authenticated');
                window.location.reload();
              }}
              className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-semibold text-xs px-3 py-2 rounded-xl border border-rose-800/60 transition-all"
              title="Sair do sistema"
            >
              🚪 Sair
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-md mx-auto w-full my-auto py-6 space-y-6">

          {/* Camera Scanner Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <span>📷</span> Leitura por Câmera
            </h2>

            <div
              id="qr-reader-container"
              className="w-full bg-slate-950 rounded-2xl border-2 border-dashed border-slate-800 min-h-[260px] overflow-hidden relative flex items-center justify-center"
            >
              {!isScanning && (
                <div className="p-6 text-center space-y-3">
                  <span className="text-5xl block">📱</span>
                  <p className="text-xs text-slate-400">
                    Posicione o QR Code da inscrição na câmera para registrar a entrada automaticamente.
                  </p>
                  <button
                    onClick={startScanner}
                    disabled={!scriptLoaded}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 text-sm"
                  >
                    {scriptLoaded ? 'Ativar Câmera do Dispositivo' : 'Carregando Câmera...'}
                  </button>
                </div>
              )}
            </div>

            {isScanning && (
              <button
                onClick={stopScanner}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 transition-all"
              >
                ⏹ Parar Câmera
              </button>
            )}

            {cameraError && (
              <div className="bg-rose-950/50 border border-rose-800/80 p-3 rounded-2xl text-xs text-rose-300">
                ⚠️ {cameraError}
              </div>
            )}
          </div>

          {/* Manual Input Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">⌨️</span>
              <h3 className="font-bold text-white text-sm">Entrada Manual por ID / Código</h3>
            </div>

            <form onSubmit={handleManualCheckin} className="space-y-3">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Digite o ID da Inscrição (ex: 12)"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-all"
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-2xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider"
              >
                ⚡ Processar Check-in
              </button>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-md mx-auto w-full py-4 text-center text-xs text-slate-500 border-t border-slate-800/60 flex justify-between items-center">
          <span>AD 2026 Check-in</span>
          <Link href="/checkin/control" className="text-amber-400 hover:underline">
            Painel de Controle ↗
          </Link>
        </footer>
      </div>
    </CheckinAuthGuard>
  );
}
