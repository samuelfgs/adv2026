
import React from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl max-h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b flex justify-between items-center bg-[#F29100] text-white">
          <h3 className="text-xl font-bold">Regulamento AD 2026</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto text-gray-700 leading-relaxed space-y-4">
          <h4 className="font-bold text-black uppercase tracking-widest text-sm">Termos e Condições</h4>
          <p>Ao se inscrever na conferência AD 2026, o participante concorda com:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>O valor da inscrição é individual e intransferível após o início do evento.</li>
            <li>O participante autoriza o uso de sua imagem em fotos e vídeos capturados durante o evento para fins de divulgação da Igreja em São Vicente.</li>
            <li>A programação está sujeita a alterações sem aviso prévio, embora busquemos manter a excelência em todos os momentos.</li>
            <li>É obrigatório o respeito às normas de conduta da instituição sede.</li>
          </ul>
          
          <h4 className="font-bold text-black uppercase tracking-widest text-sm pt-4">Cancelamento</h4>
          <p>Pedidos de cancelamento serão aceitos até 7 dias antes do início do evento, com retenção de taxas administrativas se aplicável.</p>
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-md active:scale-95"
          >
            Entendi e Concordo
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
