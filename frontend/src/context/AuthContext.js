// Arquivo /context/AuthContext.js

import React, { createContext, useState, useEffect } from "react";
import authService from "../services/authService";
import { useSocket } from "../provider/SocketContext";
import { NotificationContext } from "../context/NotificationContext";

export const AuthContext = createContext();

const AuthContextProvider = (props) => {
  const [user, setUser] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const socket = useSocket();
  const { fetchNotifications } = React.useContext(NotificationContext);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUser(user);
      getMetaData("order").then((data) => setMetadata(data));
    }
  }, []);

  const getNipc = async (username) => {
    const userInfo = await authService.getUserInfo(username);
    return userInfo.nipc;
  };

  const login = (username, password) => {
    return authService.login(username, password).then((data) => {
      authService
        .getUserInfo(data.username)
        .then((userInfo) => {
          const extendedUser = { ...data };
          setUser(extendedUser);
          localStorage.setItem("user", JSON.stringify(extendedUser)); 
          socket.emit("join", { userId: extendedUser.user_id });
          fetchNotifications(extendedUser.user_id);
        })
        .catch((error) => {
          console.error(error);
        });
      return data;
    });
  };

  const logout = () => {
    if (socket) {
      socket.close();
    }
    setUser(null);
    authService.logout();
  };

  const changePassword = async (oldPassword, newPassword) => {
    await authService.changePassword(oldPassword, newPassword);
  };

  const refreshToken = async () => {
    await authService.refreshToken();
    const updatedUser = JSON.parse(localStorage.getItem("user"));
    setUser(updatedUser);
    return updatedUser;
  };

  const getMetaData = async (dataType) =>
    await authService.getMetaData(dataType).then((data) => {
      setMetadata(data);
      return data;
    });

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        changePassword,
        refreshToken,
        getNipc,
        metadata,
        setMetadata,
        getMetaData,
        socket,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
