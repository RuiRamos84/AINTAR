import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const AlertBadge = () => {
  const [newOrderCount, setNewOrderCount] = useState(0);

  useEffect(() => {
    const socket = io("process.env.REACT_APP_API_URL"); // Substitua pela URL do seu servidor
    socket.on("new_order", (data) => {
      setNewOrderCount((prevCount) => prevCount + 1);
    });

    // Limpa o socket quando o componente é desmontado
    return () => socket.disconnect();
  }, []);

  return (
    <>
      {/* Renderiza um badge com a contagem de novos pedidos quando um novo pedido é recebido */}
      {newOrderCount > 0 && (
        <span className="badge">{newOrderCount} Novo(s) pedido(s)!</span>
      )}
    </>
  );
};

export default AlertBadge;
