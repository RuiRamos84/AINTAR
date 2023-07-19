import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AlertProvider } from "./context/AlertContext";
import { SocketProvider } from "./provider/SocketContext";
import PrivateRoute from "./context/PrivateRoutes";
import AuthContextProvider from "./context/AuthContext";
import ActivationPage from "./pages/Auth/ActivationPage";
import ChangePasswordPage from "./pages/Auth/ChangePasswordPage";
import PasswordRecoveryPage from "./pages/Auth/PasswordRecoveryPage";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage";
import Home from "./pages/Home/Home";
import Layout from "./components/Layout/Layout";
import ProfilePage from "./pages/Auth/Perfil";
import Entitys from "./pages/Entitys/Entitys";
import Documents from "./pages/Orders/Orders";
import MyOrders from "./pages/Orders/MyOrders";
import MyOrdersTasks from "./pages/Orders/MyOrdersTasks";
import NotificationContextProvider from "./context/NotificationContext";
import Dashboard from "./pages/Dashboard/Dashboard";

import "./App.css";

const App = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user ? user.user_id : null; 

  return (
    <NotificationContextProvider>
      <SocketProvider id={userId}>
        <AuthContextProvider>
          <AlertProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/activation/:id/:activation_code" element={<ActivationPage />}/>
                  <Route path="/reset_password/" element={<PrivateRoute><ResetPasswordPage /></PrivateRoute>}/>
                  <Route path="/password_recovery" element={<PasswordRecoveryPage />}/>
                  <Route path="/perfil" element={<PrivateRoute><ProfilePage /></PrivateRoute>}/>
                  <Route path="/change_password" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>}/>
                  <Route path="/entity" element={<PrivateRoute><Entitys /></PrivateRoute>}/>
                  <Route path="/orders" element={<PrivateRoute><Documents /></PrivateRoute>}/>
                  <Route path="/my_orders" element={<PrivateRoute><MyOrders /></PrivateRoute>}/>
                  <Route path="/my_orders_tasks" element={<PrivateRoute><MyOrdersTasks /></PrivateRoute>}/>
                  <Route path="/dashboard/:view_id" element={<PrivateRoute><Dashboard /></PrivateRoute>}/>
                  <Route path="/dashboard"element={<PrivateRoute><Dashboard view_id="general" /></PrivateRoute>}/>
                </Routes>
              </Layout>
            </Router>
          </AlertProvider>
        </AuthContextProvider>
      </SocketProvider>
    </NotificationContextProvider>
  );
};

export default App;
