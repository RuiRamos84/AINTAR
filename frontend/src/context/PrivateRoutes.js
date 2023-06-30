import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { AlertContext } from "./AlertContext";

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const navigate = useNavigate();

  // Se o utilizador não está autenticado, redirecionar para a página de login
  if (!user) {
    navigate("/", { replace: true });
    return null;
  }
  // Se o utilizador está autenticado mas tem uma password temporária, redirecionar para a página de redefinição de password
  else if (user.is_temp) {
    showAlert({
      variant: "warning",
      message:
        "Está a utilizar uma password temporária. Por favor, toque a sua password.",
    });
    navigate("/change_password", { replace: true });
    return null;
  }
  // Se o utilizador está autenticado e não tem uma password temporária, renderizar os children
  else {
    return children;
  }
};

export default PrivateRoute;
