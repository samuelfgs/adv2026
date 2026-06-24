import React, { useState, useEffect } from 'react';
import RegistrationForm from '../components/isv-run/RegistrationForm';
import TermsModal from '../components/isv-run/TermsModal';
import { FormData } from '../types/isv-run';

const TestADVPage: React.FC = () => {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userName, setUserName] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRegistration = (data: FormData) => {
    setUserName(data.nome.split(' ')[0]);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="max-w-md w-full space-y-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-orange-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
            <div className="relative w-20 h-20 md:w-24 md:h-24 bg-[#F29100] text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Inscrição Confirmada!</h1>
            <p className="text-base md:text-lg text-slate-600">
              Que alegria ter você conosco, <span className="text-[#F29100] font-bold">{userName}</span>!
              Sua vaga para o <span className="font-bold text-slate-900">AD 2026 (Ambiente de Teste)</span> está reservada.
            </p>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center text-left">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</p>
                <p className="text-lg font-bold text-slate-900">31 Jul - 02 Ago</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local</p>
                <p className="text-lg font-bold text-[#F29100]">ISV SP</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSubmitted(false)}
            className="w-full py-4 bg-black text-white font-bold rounded-2xl hover:bg-slate-900 transition-all shadow-xl active:scale-95"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Test Environment Banner */}
      <div className="bg-red-600 text-white text-center py-2 text-xs font-bold uppercase tracking-widest sticky top-0 z-50">
        Ambiente de Teste — Ingressos a R$ 0,01 para validação
      </div>

      {/* Sticky Header */}
      <header className={`fixed top-8 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-lg border-b border-slate-100 py-3 shadow-sm' : 'bg-transparent py-4 md:py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="font-black text-xl md:text-2xl tracking-tighter text-black">
              AD<span className="text-[#F29100]">2026</span> <span className="text-red-600 text-xs font-normal">[TESTE]</span>
            </div>
            <div className="hidden xs:block text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Igreja em São Vicente
            </div>
          </div>
          <a href="#inscricao" className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all ${scrolled ? 'bg-[#F29100] text-white' : 'bg-black text-white shadow-lg'}`}>
            Inscrever-se (Teste)
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[100svh] w-full flex items-center justify-center overflow-hidden bg-white text-slate-900 pt-20">
        <div className="absolute inset-0">
           <img 
             src="/wallpaper.jpg" 
             alt="AD 2026 Background" 
             className="w-full h-full object-cover opacity-20 grayscale-[0.5] mix-blend-multiply"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-white"></div>
        </div>

        <div className="relative max-w-7xl mx-auto w-full px-4 md:px-6 text-center space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-red-600 text-white text-[9px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] rounded-full animate-in fade-in slide-in-from-top-4 duration-700">
            AMBIENTE DE TESTE MERCADO PAGO
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-9xl font-black leading-[1] md:leading-[0.85] tracking-tighter animate-in fade-in zoom-in duration-1000 text-slate-900">
            TESTE DE <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">PAGAMENTO</span> <br className="hidden sm:block" />
            R$ 0,01
          </h1>
          <div className="pt-4 md:pt-8 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <div className="flex items-center gap-4 text-left border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-8">
              <div className="text-2xl md:text-3xl font-black text-red-600 leading-tight">VALIDAÇÃO</div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-base md:text-lg font-bold text-slate-900 leading-tight">Valor Real Debitado: R$ 0,01</p>
              <p className="text-[10px] md:text-sm text-slate-500 uppercase tracking-widest font-bold">Use para validar o checkout</p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <main id="inscricao" className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
        <div className="lg:col-span-5 space-y-6 md:space-y-8">
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">FAÇA SUA INSCRIÇÃO</h2>
            <div className="h-1.5 md:h-2 w-16 md:w-20 bg-red-600 rounded-full"></div>
            <div className="space-y-4">
              <p className="text-xl font-extrabold text-slate-900 tracking-tight text-red-600">
                R$ 0,01 INSCRIÇÃO (TESTE)
              </p>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                Esta página é utilizada exclusivamente para testar de ponta a ponta a integração de pagamento com o Mercado Pago.
              </p>
              <div className="mt-4 p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="text-sm font-bold text-slate-900">Regras do Teste:</p>
                <ul className="text-xs md:text-sm text-slate-600 space-y-2 list-disc pl-5">
                  <li>O valor unitário do ingresso é fixado em <strong>R$ 0,01</strong>.</li>
                  <li>As inscrições serão registradas no banco de dados com a marcação de teste.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <RegistrationForm
            onSubmit={handleRegistration}
            openTerms={() => setIsTermsOpen(true)}
            apiEndpoint="/api/register-test"
            ticketPriceOverride={0.01}
          />
        </div>
      </main>

      <footer className="bg-black text-white py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="font-black text-2xl md:text-3xl tracking-tighter">
              AD<span className="text-[#F29100]">2026</span>
            </div>
            <p className="text-slate-500 text-[11px] md:text-sm mt-1 md:mt-2 uppercase tracking-widest font-bold">Igreja em São Vicente</p>
          </div>
          
          <div className="text-center md:text-right text-slate-500 text-[10px] md:text-sm">
            <p>&copy; 2026 IGREJA EM SÃO VICENTE. Ambiente de Teste.</p>
          </div>
        </div>
      </footer>

      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />
    </div>
  );
};

export default TestADVPage;
