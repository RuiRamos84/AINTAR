import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertContext } from "../../context/AlertContext";
import {
  Form,
  Button,
  FormControl,
  FloatingLabel,
} from "react-bootstrap";
import axios from "axios"; 
import { validarEmail, validarPassword, validarPassIguais } from "../../utils/Utils";

const ResetPasswordPage = () => {
  const { showAlert } = useContext(AlertContext);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Obter o token a partir da URL
  const token = new URLSearchParams(location.search).get("token");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validarEmail(email)) {
      showAlert({ variant: 'danger', message: 'Email inválido.' });
      return;
    }
    
    if (!validarPassword(newPassword)) {
      showAlert({ variant: 'danger', message: 'Password inválida. A password deve ter pelo menos 8 caracteres e incluir pelo menos um número, uma letra maiúscula, uma letra minúscula e um caractere especial.' });
      return;
    }

    if (!validarPassIguais(newPassword, confirmPassword)) {
      showAlert({ variant: 'danger', message: 'As passwords não coincidem.' });
      return;
    }

    try {
      const response = await axios.post("/reset_password", { email, newPassword, token });
      if (response.status === 200) {
        showAlert({ variant: 'success', message: 'Password redefinida com sucesso!' });
        navigate("/");
      } else {
        showAlert({ variant: 'danger', message: 'Erro ao redefinir a password.' });
      }
    } catch (error) {
      showAlert({ variant: 'danger', message: 'Erro ao redefinir a password: ' + error.message });
    }
  };

  return (
    <>
      <div className="pr-container">
        <h1>Redefinir Password</h1>
        <span>Insira o seu email e a nova password.</span>
        <Form onSubmit={handleSubmit}>
          <FloatingLabel
            controlId="floatingEmail"
            label="Email"
            className="shadow-input my-2"
          >
            <FormControl
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              required
            />
          </FloatingLabel>

          <FloatingLabel
            controlId="floatingPassword"
            label="Nova Password"
            className="shadow-input my-2"
          >
            <FormControl
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder=" "
              required
            />
          </FloatingLabel>

          <FloatingLabel
            controlId="floatingConfirmPassword"
            label="Confirmação da Nova Password"
            className="shadow-input my-2"
          >
            <FormControl
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder=" "
              required
            />
          </FloatingLabel>
          <span>
            A nova password deve conter:
            <br /> no minimo 8 caracteres.
            <br /> pelo menos um número, uma letra maiúscula, uma letra minúscula e um
            caractere especial.<br />
            A nova password deve ser diferente da password anterior.
            <br />
          </span>
          <Button variant="primary" type="submit" className="shadow-btn my-2">
            Redefinir Password
          </Button>
        </Form>
      </div>
    </>
  );
};

export default ResetPasswordPage;