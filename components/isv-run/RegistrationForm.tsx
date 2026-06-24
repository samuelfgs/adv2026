import React, { useState } from "react";
import { FormData } from "../../types/isv-run";
import { formatPrice } from "../../lib/price-formatter";

interface RegistrationFormProps {
  onSubmit: (data: FormData) => void;
  openTerms: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  openTerms,
}) => {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    quantity: 1,
    kids: 0,
    aceitaTermos: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitError, setSubmitError] = useState("");

  const validateCpf = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/\D/g, "");
    return cleanCpf.length === 11;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setFormData({ ...formData, cpf: value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else if (value.length > 0) {
      value = value.replace(/^(\d*)/, "($1");
    }
    setFormData({ ...formData, telefone: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.nome.trim()) newErrors.nome = "Nome obrigatório";
    if (!formData.email.trim()) newErrors.email = "E-mail obrigatório";
    if (!validateCpf(formData.cpf)) newErrors.cpf = "CPF inválido";
    if (!formData.telefone.trim()) newErrors.telefone = "Telefone obrigatório";
    if (!formData.aceitaTermos) newErrors.aceitaTermos = "Você deve aceitar os termos";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setErrors({});

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao processar inscrição");

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        onSubmit(formData);
      }
    } catch (error: any) {
      setSubmitError(error.message || "Erro ao enviar inscrição.");
      setIsSubmitting(false);
    }
  };

  const ticketPrice = +(process.env.NEXT_PUBLIC_PRICE || "25");

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 sm:p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 space-y-6"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-slate-900">Dados do Responsável</h3>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
          <input
            required
            type="text"
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#F29100]/10 focus:border-[#F29100] transition-all outline-none"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          />
          {errors.nome && <p className="text-xs text-red-500 ml-1">{errors.nome}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
          <input
            required
            type="email"
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#F29100]/10 focus:border-[#F29100] transition-all outline-none"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
            <input
              required
              type="text"
              placeholder="000.000.000-00"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#F29100]/10 focus:border-[#F29100] transition-all outline-none"
              value={formData.cpf}
              onChange={handleCpfChange}
            />
            {errors.cpf && <p className="text-xs text-red-500 ml-1">{errors.cpf}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
            <input
              required
              type="text"
              placeholder="(00) 00000-0000"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#F29100]/10 focus:border-[#F29100] transition-all outline-none"
              value={formData.telefone}
              onChange={handlePhoneChange}
            />
            {errors.telefone && <p className="text-xs text-red-500 ml-1">{errors.telefone}</p>}
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100 my-6"></div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-slate-900">Quantidade de Ingressos (A partir de 11 anos)</h3>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#F29100] font-black text-xl"
              >
                -
              </button>
              <span className="w-12 text-center font-black text-xl text-slate-900">{formData.quantity}</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, quantity: Math.min(20, formData.quantity + 1) })}
                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#F29100] font-black text-xl"
              >
                +
              </button>
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Valor Unitário</p>
              <p className="text-lg font-bold text-slate-900">{formatPrice(ticketPrice)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-slate-900">Crianças de 3 a 10 anos</h3>
            <p className="text-xs text-slate-500 font-medium">Inscrição obrigatória, porém não pagam</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, kids: Math.max(0, formData.kids - 1) })}
                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#F29100] font-black text-xl"
              >
                -
              </button>
              <span className="w-12 text-center font-black text-xl text-slate-900">{formData.kids}</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, kids: Math.min(20, formData.kids + 1) })}
                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#F29100] font-black text-xl"
              >
                +
              </button>
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Valor Unitário</p>
              <p className="text-lg font-bold text-green-600">Grátis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 space-y-6">
        <div className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100">
          <input
            id="aceitaTermos"
            type="checkbox"
            className="w-6 h-6 rounded-lg text-[#F29100] focus:ring-[#F29100] border-slate-200 cursor-pointer accent-[#F29100]"
            checked={formData.aceitaTermos}
            onChange={(e) => setFormData({ ...formData, aceitaTermos: e.target.checked })}
          />
          <label htmlFor="aceitaTermos" className="text-xs font-medium text-slate-500 cursor-pointer select-none">
            Declaro que li e concordo com o{" "}
            <button type="button" onClick={openTerms} className="text-[#F29100] font-bold hover:underline">Regulamento Oficial</button>.
          </label>
        </div>
        {errors.aceitaTermos && <p className="text-xs text-red-500 ml-1">{errors.aceitaTermos}</p>}

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total do Pedido</span>
              <span className="text-xs text-slate-400">
                {formData.quantity} {formData.quantity === 1 ? 'ingresso' : 'ingressos'}
                {formData.kids > 0 && ` + ${formData.kids} ${formData.kids === 1 ? 'criança' : 'crianças'}`}
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900">
              {formatPrice(formData.quantity * ticketPrice)}
            </span>
          </div>
          {submitError && <p className="text-sm text-red-600 font-medium">{submitError}</p>}
          <button
            disabled={isSubmitting}
            type="submit"
            className={`w-full py-5 rounded-3xl font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 ${
              isSubmitting ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-black text-white hover:bg-slate-900 shadow-orange-500/10"
            }`}
          >
            {isSubmitting ? "PROCESSANDO..." : "CONFIRMAR E PAGAR"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default RegistrationForm;
