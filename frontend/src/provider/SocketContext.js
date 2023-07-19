// Arquivo /provider/SocketContext.js

import React, { createContext, useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import { NotificationContext } from "../context/NotificationContext";


export const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ id, children }) {
  // console.log(id);
  const { incrementOrderCount } =
    useContext(NotificationContext);
  const [socket, setSocket] = useState();
  
  console.log(process.env.REACT_APP_SOCKET);
  useEffect(() => {    
    const newSocket = io(process.env.REACT_APP_SOCKET, { query: { id } });
    setSocket(newSocket);
    newSocket.on("connect", () => {
      // console.log("Conectado ao servidor WebSocket");
      // Quando o socket estiver conectado, recupere o user_id do localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user && user.user_id; // Isso irá pegar user_id do objeto user se ele existir
      if (userId) {
        newSocket.emit("join", { userId });
      }
    });

    newSocket.on("disconnect", () => {
      // console.log("Desconectado do servidor WebSocket");
    });

    newSocket.on("connect_error", (error) => {
      // console.log("Erro de conexão:", error);
    });

    newSocket.on("join_room", () => {
      // console.log("Evento 'join_room' recebido:");
    });

    newSocket.on("order_created", (order_id) => {
      incrementOrderCount();
      // console.log("Evento 'order_created' recebido:", order_id);
    });

    // Escuta para o evento 'order_forwarded'
    newSocket.on("order_forwarded", (recipient_id) => {
      incrementOrderCount();
      // console.log("Evento 'order_forwarded' recebido:", recipient_id);
    });

    newSocket.on("error", (error) => {
      // console.log("Erro com o socket:", error);
    });

    return () => {
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.off("connect_error");
      newSocket.off("error");
      newSocket.off("join_room");
      newSocket.off("order_created");
      newSocket.off("order_forwarded");
      newSocket.close();
    };
  }, [id, incrementOrderCount]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
