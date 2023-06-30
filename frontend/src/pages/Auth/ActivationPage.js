import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { activateUser } from "../../services/authService";
import { AlertContext } from "../../context/AlertContext";

function ActivationPage() {
  const { id, activation_code } = useParams();
  const apiCallMade = useRef(false);
  const { showAlert } = useContext(AlertContext);
  const navigate = useNavigate();
  const [ativacaoConcluida, setAtivacaoConcluida] = useState(false);
  const [loading, setLoading] = useState(false); // adicionado novo estado

  const activate = async () => {
    setLoading(true); // ativa loading antes de fazer a chamada
    const result = await activateUser(id, activation_code);
    showAlert(result);

    setLoading(false); // desativa loading após a chamada ter sido feita
    if (result.variant === "success") {
      setAtivacaoConcluida(true);
      setTimeout(() => navigate("/"), 5000);
    } else {
      setAtivacaoConcluida(false);
    }
  };

  useEffect(() => {
    if (!id || !activation_code || apiCallMade.current) {
      return;
    }
    activate();
    apiCallMade.current = true;
  }, [id, activation_code, showAlert]);

  return (
    <div className="pr-container">
      <h2>Ativação da Conta</h2>
      {loading ? (
        <p>Ativando...</p>
      ) : ativacaoConcluida ? (
        <p>
          A ativação foi concluída com sucesso!
          <br />
          Agora você pode fazer login para acessar a aplicação.
          <br />
          Será redirecionado para a página principal em 5 segundos.
        </p>
      ) : (
        <p>A ativação falhou. Por favor, tente novamente mais tarde.</p>
      )}
    </div>
  );
}

export default ActivationPage;
