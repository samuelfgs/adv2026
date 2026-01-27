import React, { useState } from "react";
import { Modalidade, Gender, ShirtSize, FormData, PersonData, MultiPersonFormData } from "../../types/isv-run";
import { formatPrice } from "../../lib/price-formatter";

interface RegistrationFormProps {
  onSubmit: (data: FormData) => void;
  openTerms: () => void;
}

// Set to true to close registrations and show "Esgotado"
const REGISTRATIONS_CLOSED = true;

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  openTerms,
}) => {
  // Show sold out message when registrations are closed
  if (REGISTRATIONS_CLOSED) {
    return (
      <div className="bg-white p-6 sm:p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 text-center">
        <div className="space-y-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-red-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
            <div className="relative w-24 h-24 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-slate-900">Esgotado</h2>
            <p className="text-lg text-slate-600 max-w-md mx-auto">
              As vagas para o <strong className="text-slate-900">ISV RUN</strong> foram preenchidas.
              Obrigado pelo interesse!
            </p>
          </div>
          <div className="pt-4">
            <a
              href="https://www.instagram.com/igrejaemsv/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Siga-nos no Instagram
            </a>
          </div>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState<MultiPersonFormData>({
    email: "",
    people: [{
      nome: "",
      cpf: "",
      dataNascimento: "",
      gender: Gender.MALE,
      shirtSize: ShirtSize.M,
      modalidade: Modalidade.RUN,
      isElderly: false,
      saved: false,
    }],
    aceitaTermos: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cpfErrors, setCpfErrors] = useState<string[]>([""]);
  const [termsError, setTermsError] = useState("");
  const [dateErrors, setDateErrors] = useState<string[]>([""]);
  const [submitError, setSubmitError] = useState("");
  const [nameErrors, setNameErrors] = useState<string[]>([""]);
  const [collapsedStates, setCollapsedStates] = useState<boolean[]>([false]);

  const validateCpf = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/\D/g, "");

    if (cleanCpf.length !== 11) return false;

    // Check if all digits are the same
    // if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    // // Validate first check digit
    // let sum = 0;
    // for (let i = 0; i < 9; i++) {
    //   sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    // }
    // let checkDigit = 11 - (sum % 11);
    // if (checkDigit >= 10) checkDigit = 0;
    // if (checkDigit !== parseInt(cleanCpf.charAt(9))) return false;

    // // Validate second check digit
    // sum = 0;
    // for (let i = 0; i < 10; i++) {
    //   sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    // }
    // checkDigit = 11 - (sum % 11);
    // if (checkDigit >= 10) checkDigit = 0;
    // if (checkDigit !== parseInt(cleanCpf.charAt(10))) return false;
    return true;
  };

  const addPerson = () => {
    setFormData({
      ...formData,
      people: [...formData.people, {
        nome: "",
        cpf: "",
        dataNascimento: "",
        gender: Gender.MALE,
        shirtSize: ShirtSize.M,
        modalidade: Modalidade.RUN,
        isElderly: false,
        saved: false,
      }]
    });
    setCpfErrors([...cpfErrors, ""]);
    setDateErrors([...dateErrors, ""]);
    setNameErrors([...nameErrors, ""]);
    setCollapsedStates([...collapsedStates, false]);
  };

  const toggleCollapse = (index: number) => {
    const newCollapsedStates = [...collapsedStates];
    newCollapsedStates[index] = !newCollapsedStates[index];
    setCollapsedStates(newCollapsedStates);
  };

  const editPerson = (index: number) => {
    const newPeople = [...formData.people];
    newPeople[index] = { ...newPeople[index], saved: false };
    setFormData({ ...formData, people: newPeople });

    const newCollapsedStates = [...collapsedStates];
    newCollapsedStates[index] = false;
    setCollapsedStates(newCollapsedStates);
  };

  const savePerson = (index: number) => {
    const person = formData.people[index];

    // Validate person data
    let hasError = false;
    const newCpfErrors = [...cpfErrors];
    const newDateErrors = [...dateErrors];
    const newNameErrors = [...nameErrors];

    if (!person.nome.trim()) {
      newNameErrors[index] = "Por favor, preencha o nome completo.";
      hasError = true;
    } else {
      newNameErrors[index] = "";
    }

    if (!validateCpf(person.cpf)) {
      newCpfErrors[index] = "CPF inválido. Por favor, insira um CPF válido.";
      hasError = true;
    }

    const dateValidation = validateDate(person.dataNascimento);
    if (!dateValidation.valid) {
      newDateErrors[index] = dateValidation.error;
      hasError = true;
    }

    setCpfErrors(newCpfErrors);
    setDateErrors(newDateErrors);
    setNameErrors(newNameErrors);

    if (hasError) {
      return;
    }

    // Mark person as saved and collapse
    const newPeople = [...formData.people];
    newPeople[index] = { ...newPeople[index], saved: true };
    setFormData({ ...formData, people: newPeople });

    const newCollapsedStates = [...collapsedStates];
    newCollapsedStates[index] = true;
    setCollapsedStates(newCollapsedStates);

    // Clear submit error if all people are now saved
    const allSaved = newPeople.every(p => p.saved);
    if (allSaved) {
      setSubmitError("");
    }
  };

  const removePerson = (index: number) => {
    if (formData.people.length === 1) return; // Keep at least one person

    const newPeople = formData.people.filter((_, i) => i !== index);
    setFormData({ ...formData, people: newPeople });
    setCpfErrors(cpfErrors.filter((_, i) => i !== index));
    setDateErrors(dateErrors.filter((_, i) => i !== index));
    setNameErrors(nameErrors.filter((_, i) => i !== index));
    setCollapsedStates(collapsedStates.filter((_, i) => i !== index));
  };

  const updatePerson = (index: number, field: keyof PersonData, value: any) => {
    const newPeople = [...formData.people];
    newPeople[index] = { ...newPeople[index], [field]: value };
    setFormData({ ...formData, people: newPeople });
  };

  const handleCpfChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    updatePerson(index, "cpf", value);

    // Validate CPF when complete
    const cleanValue = value.replace(/\D/g, "");
    const newCpfErrors = [...cpfErrors];
    if (cleanValue.length === 11) {
      if (!validateCpf(value)) {
        newCpfErrors[index] = "CPF inválido";
      } else {
        newCpfErrors[index] = "";
      }
    } else {
      newCpfErrors[index] = "";
    }
    setCpfErrors(newCpfErrors);
  };

  const validateDate = (dateStr: string): { valid: boolean; error: string } => {
    if (dateStr.length !== 10) {
      return { valid: false, error: "Data incompleta" };
    }

    const parts = dateStr.split("/");
    if (parts.length !== 3) {
      return { valid: false, error: "Data inválida" };
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Check if valid numbers
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return { valid: false, error: "Data inválida" };
    }

    // Check ranges
    if (month < 1 || month > 12) {
      return { valid: false, error: "Mês inválido" };
    }

    if (day < 1 || day > 31) {
      return { valid: false, error: "Dia inválido" };
    }

    // Check if date exists
    const date = new Date(year, month - 1, day);
    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      return { valid: false, error: "Data não existe" };
    }

    // Check if date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
      return { valid: false, error: "Data não pode ser no futuro" };
    }

    // Check minimum age (e.g., 5 years old)
    const minAge = 5;
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - minAge);
    if (date > minDate) {
      return { valid: false, error: `Idade mínima: ${minAge} anos` };
    }

    // Check maximum age (e.g., 120 years old)
    const maxAge = 120;
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - maxAge);
    if (date < maxDate) {
      return { valid: false, error: "Data inválida" };
    }

    return { valid: true, error: "" };
  };

  const handleDateChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);

    if (value.length >= 5) {
      value = value.replace(/(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
    } else if (value.length >= 3) {
      value = value.replace(/(\d{2})(\d{0,2})/, "$1/$2");
    }

    updatePerson(index, "dataNascimento", value);

    // Validate date when complete
    const newDateErrors = [...dateErrors];
    if (value.length === 10) {
      const validation = validateDate(value);
      if (!validation.valid) {
        newDateErrors[index] = validation.error;
      } else {
        newDateErrors[index] = "";
      }
    } else {
      newDateErrors[index] = "";
    }
    setDateErrors(newDateErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;

    // Check if all participants are saved
    const unsavedPeople = formData.people.filter(person => !person.saved);
    if (unsavedPeople.length > 0) {
      setSubmitError("Por favor, salve todos os participantes antes de continuar.");
      window.scrollTo({
        top: document.querySelector("form")?.offsetTop || 0,
        behavior: "smooth",
      });
      return;
    }

    const newCpfErrors = [...cpfErrors];
    const newDateErrors = [...dateErrors];

    // Validate each person
    formData.people.forEach((person, index) => {
      if (!validateCpf(person.cpf)) {
        newCpfErrors[index] = "CPF inválido. Por favor, insira um CPF válido.";
        hasError = true;
      }

      const dateValidation = validateDate(person.dataNascimento);
      if (!dateValidation.valid) {
        newDateErrors[index] = dateValidation.error;
        hasError = true;
      }
    });

    setCpfErrors(newCpfErrors);
    setDateErrors(newDateErrors);

    if (!formData.aceitaTermos) {
      setTermsError("Você precisa aceitar os termos para continuar.");
      hasError = true;
    } else {
      setTermsError("");
    }

    if (hasError) {
      window.scrollTo({
        top: document.querySelector("form")?.offsetTop || 0,
        behavior: "smooth",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          people: formData.people,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar inscrição");
      }

      // Success - redirect to MercadoPago payment page
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        // Fallback if no init_point (shouldn't happen)
        // Create a legacy FormData for backwards compatibility
        const legacyData: FormData = {
          ...formData.people[0],
          email: formData.email,
          aceitaTermos: formData.aceitaTermos,
        };
        onSubmit(legacyData);
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      setSubmitError(
        error.message || "Erro ao enviar inscrição. Por favor, tente novamente."
      );
      window.scrollTo({
        top: document.querySelector("form")?.offsetTop || 0,
        behavior: "smooth",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 sm:p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 space-y-6 sm:space-y-8"
    >
      {/* Email and Modality Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900">Informações Gerais</h3>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            E-mail de Contato
          </label>
          <input
            required
            type="email"
            placeholder="joao@exemplo.com"
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder:text-slate-300"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      {/* People Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-3">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 whitespace-nowrap">
            Participantes ({formData.people.length})
          </h3>
          <button
            type="button"
            onClick={addPerson}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden xs:inline sm:inline">Adicionar Pessoa</span>
            <span className="inline xs:hidden sm:hidden">Adicionar</span>
          </button>
        </div>

        {formData.people.map((person, index) => (
          <div key={index} className={`p-4 sm:p-6 rounded-3xl border-2 transition-all ${person.saved ? 'bg-green-50/30 border-green-200' : 'bg-slate-50/50 border-slate-100'}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-700">
                    Participante {index + 1}
                  </h4>
                  {person.saved && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1 whitespace-nowrap">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Salvo
                    </span>
                  )}
                </div>
                {person.saved && collapsedStates[index] && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 min-w-0">
                    <span className="font-medium truncate">{person.nome}</span>
                    <span className="text-slate-400 hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">{person.modalidade === Modalidade.RUN ? 'Corrida 5km' : 'Caminhada 5km'}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {person.saved && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleCollapse(index)}
                      className="text-slate-600 hover:text-slate-800 transition-colors p-1.5 sm:p-1"
                      title={collapsedStates[index] ? "Expandir" : "Colapsar"}
                    >
                      <svg className={`w-5 h-5 transition-transform ${collapsedStates[index] ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => editPerson(index)}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-1.5 sm:p-1"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </>
                )}
                {formData.people.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePerson(index)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1.5 sm:p-1"
                    title="Remover pessoa"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {!collapsedStates[index] && (
              <div className="space-y-6 mt-6">

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Nome Completo
              </label>
              <input
                required
                type="text"
                placeholder="Ex: João Silva Santos"
                className={`w-full px-6 py-4 bg-white border rounded-2xl focus:ring-4 transition-all outline-none text-slate-900 placeholder:text-slate-300 ${
                  nameErrors[index]
                    ? "border-red-500 focus:ring-red-500/10 focus:border-red-500"
                    : "border-slate-200 focus:ring-blue-500/10 focus:border-blue-500"
                }`}
                value={person.nome}
                onChange={(e) => updatePerson(index, "nome", e.target.value)}
              />
              {nameErrors[index] && (
                <p className="text-xs text-red-500 font-medium ml-1">
                  {nameErrors[index]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  CPF
                </label>
                <input
                  required
                  type="text"
                  placeholder="000.000.000-00"
                  className={`w-full px-6 py-4 bg-white border rounded-2xl focus:ring-4 transition-all outline-none font-medium tracking-tight ${
                    cpfErrors[index]
                      ? "border-red-500 focus:ring-red-500/10 focus:border-red-500"
                      : "border-slate-200 focus:ring-blue-500/10 focus:border-blue-500"
                  }`}
                  value={person.cpf}
                  onChange={(e) => handleCpfChange(index, e)}
                />
                {cpfErrors[index] && (
                  <p className="text-xs text-red-500 font-medium ml-1">
                    {cpfErrors[index]}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Data de Nascimento
                </label>
                <input
                  required
                  type="text"
                  placeholder="dd/mm/aaaa"
                  className={`w-full px-6 py-4 bg-white border rounded-2xl focus:ring-4 transition-all outline-none text-slate-900 placeholder:text-slate-300 ${
                    dateErrors[index]
                      ? "border-red-500 focus:ring-red-500/10 focus:border-red-500"
                      : "border-slate-200 focus:ring-blue-500/10 focus:border-blue-500"
                  }`}
                  value={person.dataNascimento}
                  onChange={(e) => handleDateChange(index, e)}
                />
                {dateErrors[index] && (
                  <p className="text-xs text-red-500 font-medium ml-1">{dateErrors[index]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Sexo
                </label>
                <select
                  required
                  className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-900"
                  value={person.gender}
                  onChange={(e) => updatePerson(index, "gender", e.target.value as Gender)}
                >
                  <option value={Gender.MALE}>Masculino</option>
                  <option value={Gender.FEMALE}>Feminino</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Tamanho da Camisa
                </label>
                <select
                  required
                  className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-900"
                  value={person.shirtSize}
                  onChange={(e) => updatePerson(index, "shirtSize", e.target.value as ShirtSize)}
                >
                  <option value={ShirtSize.PP}>PP</option>
                  <option value={ShirtSize.P}>P</option>
                  <option value={ShirtSize.M}>M</option>
                  <option value={ShirtSize.G}>G</option>
                  <option value={ShirtSize.GG}>GG</option>
                  <option value={ShirtSize.XGG}>XGG</option>
                  <option value={ShirtSize.XXGG}>XXGG</option>
                </select>
              </div>
            </div>

            {/* Modalidade Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Modalidade
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => updatePerson(index, "modalidade", Modalidade.RUN)}
                  className={`group p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                    person.modalidade === Modalidade.RUN
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        person.modalidade === Modalidade.RUN
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300"
                      }`}
                    >
                      {person.modalidade === Modalidade.RUN && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <svg
                      className={`w-8 h-8 ${
                        person.modalidade === Modalidade.RUN
                          ? "text-blue-600"
                          : "text-slate-300"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <p
                    className={`font-black text-lg ${
                      person.modalidade === Modalidade.RUN
                        ? "text-blue-600"
                        : "text-slate-400"
                    }`}
                  >
                    Corrida 5km
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Primeiro pelotão
                  </p>
                </div>

                <div
                  onClick={() => updatePerson(index, "modalidade", Modalidade.WALK)}
                  className={`group p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                    person.modalidade === Modalidade.WALK
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        person.modalidade === Modalidade.WALK
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300"
                      }`}
                    >
                      {person.modalidade === Modalidade.WALK && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <svg
                      className={`w-8 h-8 ${
                        person.modalidade === Modalidade.WALK
                          ? "text-blue-600"
                          : "text-slate-300"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p
                    className={`font-black text-lg ${
                      person.modalidade === Modalidade.WALK
                        ? "text-blue-600"
                        : "text-slate-400"
                    }`}
                  >
                    Caminhada 5km
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Ritmo livre
                  </p>
                </div>
              </div>
            </div>

            {/* Elderly Checkbox */}
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-blue-50/50 border border-blue-200">
                <div className="relative flex items-center h-5">
                  <input
                    id={`isElderly-${index}`}
                    type="checkbox"
                    className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 border-slate-200 cursor-pointer accent-blue-600"
                    checked={person.isElderly || false}
                    onChange={(e) => updatePerson(index, "isElderly", e.target.checked)}
                  />
                </div>
                <label
                  htmlFor={`isElderly-${index}`}
                  className="text-sm font-medium text-slate-700 leading-relaxed select-none cursor-pointer"
                >
                  <strong className="font-bold text-blue-700">Idoso (60+ anos)</strong>
                  <p className="text-xs text-slate-600 mt-1">
                    Desconto de 50% aplicado. Será necessário apresentar documento com data de nascimento no dia da retirada do kit.
                  </p>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={() => savePerson(index)}
              disabled={person.saved}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                person.saved
                  ? "bg-green-100 text-green-700 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              }`}
            >
              {person.saved ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Participante Salvo
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Salvar Participante
                </>
              )}
            </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 space-y-6">
        <div className="space-y-2">
          <div
            className={`flex items-start gap-4 p-5 rounded-[1.5rem] border ${
              termsError
                ? "bg-red-50 border-red-200"
                : "bg-slate-50 border-slate-100"
            }`}
          >
            <div className="relative flex items-center h-5">
              <input
                id="aceitaTermos"
                type="checkbox"
                className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500 border-slate-200 cursor-pointer accent-blue-600"
                checked={formData.aceitaTermos}
                onChange={(e) => {
                  setFormData({ ...formData, aceitaTermos: e.target.checked });
                  if (e.target.checked) setTermsError("");
                }}
              />
            </div>
            <label
              htmlFor="aceitaTermos"
              className="text-xs font-medium text-slate-500 leading-normal select-none cursor-pointer"
            >
              Declaro que li e concordo com o{" "}
              <button
                type="button"
                onClick={openTerms}
                className="text-blue-600 font-bold hover:underline"
              >
                Regulamento Oficial
              </button>{" "}
              da prova, assumindo total responsabilidade pela minha saúde e
              participação.
            </label>
          </div>
          {termsError && (
            <p className="text-xs text-red-500 font-medium ml-1">
              {termsError}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 px-2">
            <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider sm:tracking-widest">
              Total a pagar ({formData.people.length} {formData.people.length === 1 ? 'pessoa' : 'pessoas'})
            </span>
            <span className="text-3xl sm:text-2xl font-black text-slate-900">
              {formatPrice(String(
                formData.people.reduce((total, person) => {
                  const basePrice = +(process.env.NEXT_PUBLIC_PRICE || "70");
                  const personPrice = person.isElderly ? basePrice / 2 : basePrice;
                  return total + personPrice;
                }, 0)
              ))}
            </span>
          </div>
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm text-red-600 font-medium">{submitError}</p>
            </div>
          )}
          <button
            disabled={isSubmitting}
            type="submit"
            className={`w-full py-5 rounded-3xl font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
              isSubmitting
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 shadow-blue-500/20"
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                PROCESSANDO...
              </>
            ) : (
              "CONFIRMAR INSCRIÇÃO"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default RegistrationForm;
