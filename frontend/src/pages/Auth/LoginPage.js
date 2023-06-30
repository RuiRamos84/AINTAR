import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Modal, Button, Form, FloatingLabel} from "react-bootstrap";
import { AlertContext } from "../../context/AlertContext";

const LoginModal = ({ showModal, handleCloseModal, switchToRegisterModal }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { showAlert, alert } = useContext(AlertContext);
  const navigate = useNavigate();


  const { login, user } = useContext(AuthContext);

  const handlePasswordRecovery = () => {
    handleCloseModal();
    navigate("/password_recovery");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await login(username, password);
      if (data) {
        setUsername("");
        setPassword("");
        if (data.is_temp) {
          showAlert({
            icon: "warning",
            title: "Password temporária",
            text: "Está a utilizar uma password temporária, por favor troque a sua password! Enquanto não o fizer não poderá aceder a aplicação.",
            confirmButtonText: "OK",
            willClose: () => {
              navigate("/reset_password");
            },
          });
          handleCloseModal();
        } else {
          showAlert(
            {
              variant: "success",
              message: `Bem-vindo(a), ${data.user_name}! Login realizado com sucesso!`,
            },
            true
          );
          }
          handleCloseModal();
          setError(null);
          navigate("/");
        }      
    } catch (error) {
      showAlert({
        icon: "error",
        title: "Oops...",
        text: "Email ou password erradas!",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <>
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Login</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleLogin}>
            <FloatingLabel
              controlId="formUsername"
              label="Username"
              className="shadow-input my-2"
            >
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoFocus
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="formPassword"
              label="Password"
              className="shadow-input my-2"
            >
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
            </FloatingLabel>
            <Button variant="primary" type="submit" className="shadow-btn my-2">
              Entrar
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <p className="my-1">
            Ainda não tem conta?{" "}
            <span
              className="text-primary"
              onClick={switchToRegisterModal}
              style={{ cursor: "pointer" }}
            >
              Registe-se
            </span>
          </p>
          <p className="my-1">
            Não se recorda da sua Password?{" "}
            <span
              className="text-primary"
              onClick={handlePasswordRecovery}
              style={{ cursor: "pointer" }}
            >
              Redefinir Password
            </span>
          </p>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default LoginModal;
