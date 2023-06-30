import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getUserInfo, updateUserInfo } from "../../services/authService";
import {
  Card,
  Col,
  Row,
  Button,
  Modal,
  Form,
  FloatingLabel,
  FormControl,
} from "react-bootstrap";
import { fieldMappings } from "../../utils/Utils";
import { AlertContext } from "../../context/AlertContext";

import "../../App.css";

const fieldMappingsArray = Object.values(fieldMappings);
const fieldNames = fieldMappingsArray.map((field) => field.name);

const Perfil = () => {
  const { showAlert } = useContext(AlertContext);
  const [identTypes, setIdentTypes] = useState([]);
  const { user } = useContext(AuthContext);
  const [userInfo, setUserInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const data = await getUserInfo();
        setUserInfo(data.user_info);
        setIdentTypes(data.ident_types);
        setFormData(data.user_info);
      } catch (error) {
        console.error("Erro ao obter informações do utilizador", error);
      }
    };

    if (user) {
      fetchUserInfo();
    }
  }, [user]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await updateUserInfo(formData);
      if (response.mensagem) {
        setUserInfo(formData);
        setShowModal(false);
        showAlert({ variant: "success", message: response.mensagem });
      } else {
        console.error(response.erro);
        showAlert({ variant: "danger", message: response.erro });
      }
    } catch (error) {
      console.error("Erro ao atualizar informações do utilizador", error);
    }
  };

  const renderUserInfo = () => {
    return Object.keys(userInfo).map((key) => {
      if (key === "pk") {
        return null;
      }
      const fieldMapping = fieldMappingsArray.find(
        (mapping) => mapping.name === key
      );
      const label = fieldMapping ? fieldMapping.label : key;
      return (
        <Row key={key}>
          <Col sm={4} className="text-end">
            <strong>{label}:</strong>
          </Col>
          <Col sm={8} className="text-start">
            {key === "ident_type"
              ? identTypes.find((type) => type.pk === userInfo[key])?.value
              : userInfo[key]}
          </Col>
        </Row>
      );
    });
  };

  return (
    <div className="pr-container">
      <div className="d-flex justify-content-between align-items-center">
        <h1 className="mx-4">Os meus dados</h1>
        <Button className="shadow-btn" onClick={() => setShowModal(true)}>
          Editar
        </Button>
      </div>
      {userInfo && (
        <>
          <Card className="w-auto profile-card">
            <Card.Body className="relative-container">
              {renderUserInfo()}
            </Card.Body>
          </Card>
          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Editar Perfil</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleSubmit}>
                {fieldNames.map((name) => {
                  const fieldMapping = fieldMappingsArray.find(
                    (field) => field.name === name
                  );
                  if (
                    !fieldMapping ||
                    name === "pk" ||
                    !userInfo.hasOwnProperty(name)
                  ) {
                    return null;
                  }
                  const { label, type } = fieldMapping;
                  if (name === "ident_type") {
                    return (
                      <FloatingLabel
                        controlId={name}
                        label={label}
                        className="shadow-input my-2"
                        key={name}
                      >
                        <Form.Select
                          name={name}
                          value={formData[name] || ''}
                          onChange={handleInputChange}
                        >
                          {identTypes.map((type) => (
                            <option key={type.pk} value={type.pk}>
                              {type.value}
                            </option>
                          ))}
                        </Form.Select>
                      </FloatingLabel>
                    );
                  } else if (type === "textarea") {
                    return (
                      <FloatingLabel
                        controlId={name}
                        label={label}
                        className="shadow-input my-2"
                        key={name}
                      >
                        <Form.Control
                          as="textarea"
                          name={name}
                          value={formData[name] || ''}
                          onChange={handleInputChange}
                        />
                      </FloatingLabel>
                    );
                  } else {
                    return (
                      <FloatingLabel
                        controlId={name}
                        label={label}
                        className="shadow-input my-2"
                        key={name}
                      >
                        <FormControl
                          type={type}
                          name={name}
                          value={String(formData[name] || '')}
                          onChange={handleInputChange}
                        />
                      </FloatingLabel>
                    );
                  }
                })}
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
                className="shadow-btn my-2"
              >
                Fechar
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                className="shadow-btn my-2"
              >
                Salvar
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
};

export default Perfil;
