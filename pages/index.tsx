
import React, { useState, useEffect } from 'react';
import RegistrationForm from '../components/isv-run/RegistrationForm';
import TermsModal from '../components/isv-run/TermsModal';
import { FormData } from '../types/isv-run';
import { formatPrice } from '../lib/price-formatter';

const ADVPage: React.FC = () => {
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
              Sua vaga para o <span className="font-bold text-slate-900">AD 2026</span> está reservada.
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
      {/* Sticky Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-lg border-b border-slate-100 py-3 shadow-sm' : 'bg-transparent py-4 md:py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="font-black text-xl md:text-2xl tracking-tighter text-black">
              AD<span className="text-[#F29100]">2026</span>
            </div>
            <div className="hidden xs:block text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Igreja em São Vicente
            </div>
          </div>
          <a href="#inscricao" className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all ${scrolled ? 'bg-[#F29100] text-white' : 'bg-black text-white shadow-lg'}`}>
            Inscrever-se
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
          <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-[#F29100] text-white text-[9px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] rounded-full animate-in fade-in slide-in-from-top-4 duration-700">
            CONFERÊNCIA ADORAÇÃO E DISCIPULADO 2026
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-9xl font-black leading-[1] md:leading-[0.85] tracking-tighter animate-in fade-in zoom-in duration-1000 text-slate-900">
            DISCIPULADO <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F29100] to-orange-600">E A ESTRATÉGIA</span> <br className="hidden sm:block" />
            DE JESUS
          </h1>
          <div className="pt-4 md:pt-8 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <div className="flex items-center gap-4 text-left border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-8">
              <div className="text-2xl md:text-3xl font-black text-[#F29100] leading-tight">31 JUL - 02 AGO</div>
              <div className="text-base font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">2026</div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-base md:text-lg font-bold text-slate-900 leading-tight">ISV São Vicente</p>
              <p className="text-[10px] md:text-sm text-slate-500 uppercase tracking-widest font-bold">São Vicente, SP</p>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 animate-bounce text-slate-300">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7m14-8l-7 7-7-7"/></svg>
        </div>
      </section>

      {/* Speakers Section */}
      <section className="py-20 md:py-32 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-12 md:mb-20 space-y-3 md:space-y-4">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter">PRELETORES</h2>
            <div className="h-1.5 md:h-2 w-16 md:w-24 bg-[#F29100] rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { name: 'DANIEL SOUZA', role: 'LOUVOR / PALAVRA', img: '/daniel.jpeg' },
              { name: 'JAN GOTTFRIDSON', role: 'PALAVRA', img: '/jan.jpeg' },
              { name: 'ASAPH BORBA', role: 'LOUVOR / PALAVRA', img: '/asaph.jpeg' }
            ].map((speaker, i) => (
              <div key={i} className="group relative text-center">
                <div className="aspect-[4/5] overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-slate-100 mb-4 md:mb-6 border border-slate-100 grayscale hover:grayscale-0 transition-all duration-700">
                  <img src={speaker.img} alt={speaker.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <h3 className="text-xl md:text-2xl font-black tracking-tight">{speaker.name}</h3>
                <p className="text-[10px] md:text-sm font-bold text-[#F29100] tracking-widest mt-1 uppercase">{speaker.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="py-20 md:py-32 px-4 md:px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-16 shadow-2xl shadow-orange-900/5 border border-slate-100">
            <div className="text-center mb-10 md:mb-16">
              <span className="text-[10px] md:text-xs font-black text-[#F29100] uppercase tracking-[0.4em]">Programação</span>
              <h2 className="text-3xl md:text-5xl font-black mt-2 tracking-tighter text-slate-900">HORÁRIOS</h2>
            </div>

            <div className="space-y-10 md:space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                <div className="space-y-3 md:space-y-4">
                  <div className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest pb-2 border-b-2 border-slate-100">Sexta • 31/07</div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-[#F29100] text-sm md:text-base">20:00</span>
                    <span className="text-slate-600 font-medium text-sm md:text-base">Abertura</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-[#F29100] text-sm md:text-base">22:00</span>
                    <span className="text-slate-600 font-medium text-sm md:text-base">Encerramento</span>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest pb-2 border-b-2 border-slate-100">Sábado • 01/08</div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tarde</p>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-[#F29100] text-sm md:text-base">16:00 - 18:00</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Noite</p>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-[#F29100] text-sm md:text-base">19:30 - 22:00</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest pb-2 border-b-2 border-slate-100">Domingo • 02/08</div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-[#F29100] text-sm md:text-base">10:00</span>
                    <span className="text-slate-600 font-medium text-sm md:text-base">Início</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-[#F29100] text-sm md:text-base">12:00</span>
                    <span className="text-slate-600 font-medium text-sm md:text-base">Encerramento</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 md:pt-8 border-t border-slate-100 flex justify-center">
                 <div className="flex items-center gap-2 md:gap-3 text-slate-400">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span className="text-[10px] md:text-sm font-bold">Igreja em São Vicente - ISV</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <main id="inscricao" className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
        <div className="lg:col-span-5 space-y-6 md:space-y-8">
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">FAÇA SUA INSCRIÇÃO</h2>
            <div className="h-1.5 md:h-2 w-16 md:w-20 bg-[#F29100] rounded-full"></div>
            <div className="space-y-4">
              <p className="text-xl font-extrabold text-slate-900 tracking-tight">
                R$25 INSCRIÇÃO
              </p>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                Junte-se a nós nesta jornada de discipulado. O valor da inscrição garante sua participação nos 3 dias de evento.
              </p>
              <div className="mt-4 p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="text-sm font-bold text-slate-900">Valores e Regras:</p>
                <ul className="text-xs md:text-sm text-slate-600 space-y-2 list-disc pl-5">
                  <li><strong className="text-slate-800">A partir dos 11 anos:</strong> Paga o valor integral de <strong>R$ 25</strong>.</li>
                  <li><strong className="text-slate-800">Crianças de 3 a 10 anos:</strong> Devem fazer a inscrição, mas <strong className="text-orange-600 font-bold">não pagam</strong>.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="p-5 md:p-6 rounded-3xl bg-slate-50 border border-slate-100">
               <h4 className="font-bold text-slate-900 mb-1 md:mb-2 text-sm md:text-base">Dúvidas?</h4>
               <p className="text-[11px] md:text-sm text-slate-500">Entre em contato pelo nosso Instagram ou visite-nos em nossa sede.</p>
            </div>
            
            <a href="https://www.instagram.com/igrejaemsv/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 md:gap-4 group">
               <div className="w-10 h-10 md:w-12 md:h-12 bg-black text-white rounded-2xl flex items-center justify-center group-hover:bg-[#F29100] transition-colors shadow-lg">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
               </div>
               <div>
                  <p className="font-bold text-sm md:text-base">@igrejaemsv</p>
                  <p className="text-[10px] md:text-xs text-slate-400">Siga para novidades</p>
               </div>
            </a>
          </div>
        </div>

        <div className="lg:col-span-7">
          <RegistrationForm
            onSubmit={handleRegistration}
            openTerms={() => setIsTermsOpen(true)}
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
            <p>&copy; 2026 IGREJA EM SÃO VICENTE. Todos os direitos reservados.</p>
            <p className="mt-1">Feito com fé e propósito • AD 2026</p>
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

export default ADVPage;
