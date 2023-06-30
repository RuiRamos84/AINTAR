import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertContext } from "../../context/AlertContext";
import { Form, Button, FormControl, FloatingLabel } from "react-bootstrap";
import axios from "axios";

const PasswordRecoveryPage = () => {
  const { showAlert } = useContext(AlertContext);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false); // Estado para controlar a exibição da mensagem de e-mail enviado
  const [isLoading, setIsLoading] = useState(false); // Estado para controlar a exibição da mensagem de carregamento
  const navigate = useNavigate();

  useEffect(() => {
    if (emailSent) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [emailSent, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true); // Atualiza o estado para exibir a mensagem de carregamento
    try {
      const response = await axios.post("/password_recovery", { email });
      if (response.status === 200) {
        setEmailSent(true); // Atualiza o estado para exibir a mensagem de e-mail enviado
        showAlert({
          variant: "success",
          message: "E-mail enviado com sucesso!",
        });
      } else {
        showAlert({
          variant: "danger",
          message: "Erro ao recuperar a password.",
        });
      }
    } catch (error) {
      showAlert({
        variant: "danger",
        message: "Erro ao recuperar a password: " + error.message,
      });
    } finally {
      setIsLoading(false); // Atualiza o estado para esconder a mensagem de carregamento
    }
  };

  return (
    <div className="pr-container">
      <h1>Recuperação de password</h1>
      {emailSent ? (
        <p>
          Foi enviado um e-mail com as instruções para recuperar a sua password.
          Você será redirecionado para a página inicial em 6 segundos.
        </p>
      ) : (
        <p>
          Digite o seu e-mail abaixo e enviaremos as instruções para recuperar a
          sua password.
        </p>
      )}

      {!emailSent && (
        <Form onSubmit={handleSubmit}>
          <FloatingLabel
            controlId="floatingEmail"
            label="Email"
            className="my-2"
          >
            <FormControl
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              required
            />
          </FloatingLabel>
          <p className=" size small">
            <strong>Atenção:</strong>
            <br />O link enviado por e-mail:
            <br />
            &nbsp;- É válido por 1 hora.
            <br />
            &nbsp;- Só pode ser usado uma vez.
            <br />
            &nbsp;- Só pode ser usado para redefinir a password do utilizador
            associado ao e-mail informado.
          </p>
          <Button variant="primary" type="submit" className="shadow-btn">
            {isLoading ? "Enviando..." : "Recuperar password"}
          </Button>
        </Form>
      )}
    </div>
  );
};

export default PasswordRecoveryPage;
