import React, { useEffect, useState } from "react";
import DashboardService from "../../services/DashboardServices"; // Certifique-se de importar a partir do caminho correto

const GeneralDashboard = () => {
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    const fetchRecentRequests = async () => {
      try {
        const requests = await DashboardService.getMyRecentRequests();
        setRecentRequests(requests);
      } catch (error) {
        console.error("Erro ao buscar dados: ", error);
      }
    };
    fetchRecentRequests();
  }, []);

  return (
    <div>
      <h1>Pedidos Recentes</h1>
      <table>
        <thead>
          <tr>
            <th>Entidade</th>
            <th>Associação</th>
            <th>Tipo</th>
            <th>Registo</th>
            <th>Submissão</th>
            <th>Criador</th>
          </tr>
        </thead>
        <tbody>
          {recentRequests.map((request) => (
            <tr key={request.pk}>
              <td>{request.ts_entity}</td>
              <td>{request.ts_associate}</td>
              <td>{request.tt_type}</td>
              <td>{request.regnumber}</td>
              <td>{request.submission.toLocaleString()}</td>
              <td>{request.creator}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GeneralDashboard;
