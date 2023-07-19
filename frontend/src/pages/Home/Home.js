import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Home = () => {
  const { user, Login } = useContext(AuthContext);
  

  return (
    <div className="container">
      <h1>Bem-vindo à AINTAR</h1>
      {user ? (
        <>
          <div>
            <p>Olá, {user.user_name}! Bem-vindo(a) de volta!</p>
            <p>Aqui está o seu conteúdo personalizado:</p>
          </div>
        </>
      ) : (
        <div>
          <p>Esta é a página inicial da minha aplicação.</p>
          <p>Por favor, faça login para acessar o conteúdo personalizado.</p>
          </div>
      )}
    </div>
  );
};

export default Home;
