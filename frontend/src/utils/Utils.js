import axios from "axios";

// ---------------------------
// Validations
// ---------------------------
export function validarNif(nif) {
  if (typeof nif !== "string") return false;
  nif = nif.replace(/\s+/g, "");
  if (!/^\d{9}$/.test(nif)) return false;

  let checkDigit = 0;
  for (let i = 0; i < 8; i++) {
    checkDigit += parseInt(nif[i]) * (9 - i);
  }
  checkDigit = 11 - (checkDigit % 11);
  if (checkDigit >= 10) checkDigit = 0;

  return checkDigit === parseInt(nif[8]);
}

export function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}


export const validarPassword = (password) => {
  const regex =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[a-zA-Z]).{8,}$/;
  return regex.test(password);
};


export function validarPassIguais(senha1, senha2) {
  return senha1 === senha2;
}

// ---------------------------
// Data formatting
// --------------------------
export const getIdentTypeValue = (identTypes, pk) => {
  const identType = identTypes.find((type) => type.pk === pk);
  return identType ? identType.value : "";
};

// ---------------------------
// Data fetching
// ---------------------------
export async function getMetaData(tipo) {
  try {
    const response = await axios.get(`/metaData?tipo=${tipo}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar metadados do tipo ${tipo}:`, error);
  }
}





// ---------------------------
// Form fields
// ---------------------------
export const fieldMappings = [
  { name: "nipc", label: "Nº Fiscal", type: "text" },
  { name: "name", label: "Nome", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Telefone", type: "text" },
  { name: "address", label: "Morada", type: "text" },
  { name: "postal", label: "Código Postal", type: "text" },
  { name: "ident_type", label: "Tipo de identificação", type: "text" },
  { name: "ident_value", label: "Número de identificação", type: "text" },
  { name: "descr", label: "Descrição", type: "text" },
  { name: "regnumber", label: "Nº de Registo", type: "text" },
  { name: "ts_entity", label: "Entidade", type: "text" },
  { name: "ts_associate", label: "Associado", type: "text" },
  { name: "tt_type", label: "Tipo", type: "text" },
  { name: "submission", label: "Submissão", type: "text" },
  { name: "type_countyear", label: "Contagem Anual do Tipo", type: "number" },
  { name: "type_countall", label: "Contagem Total do Tipo", type: "number" },
  { name: "memo", label: "Observações", type: "textarea" },
  { name: "creator", label: "Criador", type: "text" },
  { name: "who", label: "Portador", type: "text" },
  { name: "what", label: "Estado", type: "text" },
  { name: "password", label: "Password", type: "password" },
  { name: "when_start", label: "Início", type: "text" },
  { name: "when_stop", label: "Fim", type: "text" },
  { name: "filename", label: "Anexo", type: "text" },
  {
    name: "confirmPassword",
    label: "Confirmar Password",
    type: "password",
  },
];
// --------------------------