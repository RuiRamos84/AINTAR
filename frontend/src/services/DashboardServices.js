import axios from "axios";

const DashboardService = {
  getViewData: async (view_id) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/dashboard_data/${view_id}`
      );
      const data = response.data.dados;
      // console.log('request', data)
      return data;
    } catch (error) {
      console.error("Erro ao buscar dados: ", error);
      throw error; // Você pode querer lidar com esse erro de maneira diferente
    }
  },

  getMyRecentRequests: async () => {
    const response = await axios.get("/document_self");
    const documents = response.data.document_self;

    // Converter a string de submissão para um objeto Date, para facilitar a comparação
    documents.forEach((doc) => {
      doc.submission = new Date(doc.submission.replace(" às ", "T"));
    });

    // Ordenar os documentos por data de submissão, do mais recente para o mais antigo
    documents.sort((a, b) => b.submission - a.submission);

    // Pegar apenas os 5 primeiros documentos (ou seja, os 5 mais recentes)
    const recentDocuments = documents.slice(0, 5);

    return recentDocuments;
  },

  getmetadata: async () => {
    const response = await axios.get("/metaData?tipo=views");
    const metadata = response.data.views;
    return metadata;
  },
};

export default DashboardService;
