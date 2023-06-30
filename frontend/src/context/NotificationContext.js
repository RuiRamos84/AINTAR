// Arquivo /context/NotificationContext.js
import React, { createContext, useState, useEffect } from "react";
import AuthService from "../services/authService";

export const NotificationContext = createContext();

const NotificationContextProvider = (props) => {
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user && user.user_id;
    if (userId) {
      fetchNotifications();
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await AuthService.getNotifications();
      setOrderCount(response);
      // console.log(response);
    } catch (error) {
      // console.error("Erro ao buscar notificações:", error);
    }
  };

  const incrementOrderCount = async (recipient_id) => {
    try {
      await AuthService.incrementOrderCount(recipient_id);
      setOrderCount((oldCount) => {
        // console.log("Novo valor de orderCount:", oldCount + 1);
        return oldCount + 1;
      });
    } catch (error) {
      // console.error("Erro ao incrementar a contagem de pedidos:", error);
    }
  };

  const resetOrderCount = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      await AuthService.resetOrderCount(user.user_id);
      // console.log("Resetei a contagem de pedidos.");
      setOrderCount(0);
    } catch (error) {
      // console.error("Erro ao resetar a contagem de pedidos:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        orderCount,
        fetchNotifications,
        incrementOrderCount,
        resetOrderCount,
      }}
    >
      {props.children}
    </NotificationContext.Provider>
  );
};

export default NotificationContextProvider;
