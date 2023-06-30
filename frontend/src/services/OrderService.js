import axios from "axios";

const OrdersService = {
  getDocuments: () => axios.get("/documents"),
  addDocument: (documentData) =>
    axios.post("/documents", documentData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getMyRequests: () => axios.get("/document_self"),
  getDocumentStep: (pk) => axios.post(`/get_document_step/${pk}`),
  createOrUpdateDocumentStep: (pk, documentStepData) => {
    console.log(
      `Criando ou atualizando etapa do documento ${pk}:`,
      documentStepData
    ); // debug
    return axios
      .post(`/create_or_update_document_step/${pk}`, documentStepData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => {
        console.log(
          `Etapa do documento ${pk} criada ou atualizada:`,
          response.data
        ); // debug
        return response;
      });
  },
  downloadFile: (regnumber, pk, filename) =>
    axios({
      url: `/download_file/${regnumber}/${pk}`,
      method: "GET",
      responseType: "blob", // Isso é importante
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename); // Use o nome de arquivo original recebido como parâmetro
      document.body.appendChild(link);
      link.click();
    }),
};

export default OrdersService;

