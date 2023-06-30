import React, { useState } from "react";
import { Modal, Button, Form, FloatingLabel } from "react-bootstrap";
import Swal from "sweetalert2";
import authService from "../../services/authService";
import {
  fieldMappings,
  validarEmail,
  validarNif,
  validarPassword,
  validarPassIguais,
} from "../../utils/Utils";

const UserModal = ({ showModal, handleCloseModal, switchToLoginModal }) => {
  const desiredFields = ["nipc", "name", "email", "password", "confirmPassword"];  
  const filteredFieldMappings = fieldMappings.filter((field) =>
    desiredFields.includes(field.name));
  const [buttonText, setButtonText] = useState("Enviar");
  

  const [userData, setUserData] = useState({
    name: "",
    nipc: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({
    name: false,
    nipc: false,
    email: false,
    password: false,
    confirmPassword: false,
    
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setUserData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prevTouched) => ({ ...prevTouched, [name]: true }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      setButtonText("A criar a Conta...");
      const response = await authService.createUser(userData);
      if (response.status === 201) {
        Swal.fire(
          "A conta foi criada com sucesso.",
          "Foi enviado um e-mail com um link para ativar sua conta. Verifique o seu e-mail e siga as instruções para ativar a sua conta antes de utilizar o sistema.",
          "success"
        );
        setUserData({
          name: "",
          nipc: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setButtonText("Conta Criada!");
        handleCloseModal();
        setButtonText("Enviar");
      }
    } catch (error) {
      setButtonText("Enviar");
      Swal.fire("Erro", "Falha ao criar Utilizador", "error");
    }
  };


  const validateField = (fieldName, fieldValue) => {
    switch (fieldName) {
      case "nipc":
        return validarNif(fieldValue);
      case "email":
        return validarEmail(fieldValue);
      case "password":
        return validarPassword(fieldValue);
      case "confirmPassword":
        return validarPassIguais(userData.password, fieldValue);
      default:
        return true;
    }
  };

  return (
    <Modal show={showModal} onHide={handleCloseModal}>
      <Modal.Header closeButton>
        <Modal.Title>Registo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleFormSubmit}>
          {filteredFieldMappings.map((field) => (
            <FloatingLabel
              controlId={`form${field.name}`}
              label={field.label}
              className="shadow-input my-3"
              key={field.name}
            >
              <Form.Control
                type={field.type}
                name={field.name}
                value={userData[field.name]}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={field.label}
                isInvalid={
                  touched[field.name] &&
                  !validateField(field.name, userData[field.name])
                }
              />
              <Form.Control.Feedback type="invalid">
                {field.label} inválido
              </Form.Control.Feedback>
            </FloatingLabel>
          ))}
          <Button variant="primary" type="submit" className="shadow-btn my-2">
            {buttonText}
          </Button>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <p className="my-1">
          Já tem uma conta? Entre
          <span
            className="text-primary"
            onClick={switchToLoginModal}
            style={{ cursor: "pointer" }}
          >
            {" "}
            aqui
          </span>
        </p>
      </Modal.Footer>
    </Modal>
  );
};

export default UserModal;
