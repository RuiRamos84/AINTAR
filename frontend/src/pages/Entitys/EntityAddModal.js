import React, { useState, useEffect } from "react";
import { Modal, Button, Form, FloatingLabel } from "react-bootstrap";
import EntityService from "../../services/EntityService";
import { fieldMappings } from "../../utils/Utils";
import { AlertContext } from "../../context/AlertContext";

const AddEditEntity = ({ entity, onClose, identTypes, entityFields }) => {
  const { showAlert } = React.useContext(AlertContext);
  const [entityData, setEntityData] = useState(
    entityFields.reduce((obj, field) => {
      obj[field] = entity ? entity[field] : "";
      return obj;
    }, {})
  );
  const [emptyRequiredFields, setEmptyRequiredFields] = useState([]);

  // Definir campos obrigatórios como constante
  const requiredFields = ["name", "nipc"]; // Adicione outros campos obrigatórios conforme necessário

  useEffect(() => {
    setEntityData(entity || {});
  }, [entity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntityData((prevEntityData) => ({
      ...prevEntityData,
      [name]: value,
    }));

    // Atualizar campos obrigatórios vazios
    if (!value && entityFields.find((field) => field === name)) {
      setEmptyRequiredFields((prevEmptyFields) =>
        prevEmptyFields.includes(name)
          ? prevEmptyFields
          : [...prevEmptyFields, name]
      );
    } else {
      setEmptyRequiredFields((prevEmptyFields) =>
        prevEmptyFields.filter((field) => field !== name)
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Verificar campos obrigatórios
    const missingFields = requiredFields.filter(
      (field) => !entityData[field] || entityData[field].trim() === ""
    );

    if (missingFields.length > 0) {
      setEmptyRequiredFields(missingFields);
      showAlert({
        title: "Campos Obrigatórios",
        icon: "warning",
        position: "center",
        text: "Por favor, preencha todos os campos obrigatórios.",
        showConfirmButton: true,
        confirmButtonText: "OK",
        allowOutsideClick: false,
      });
      return;
    }

    // Continuar com a ação se todos os campos obrigatórios estiverem preenchidos
    const action = entity
      ? EntityService.updateEntity
      : EntityService.addEntity;

    action(entityData)
      .then((res) => {
        showAlert({
          variant: "success",
          message: "Entidade criada/editada com sucesso!",
        });
        onClose();
      })
      .catch((err) => {
        // console.error(err);
        const errorMessage =
          err.response?.data?.erro || "Erro ao criar/editar entidade.";
        showAlert({
          title: "Oops...",
          icon: "error",
          position: "center",
          text: errorMessage,
          showConfirmButton: true,
          confirmButtonText: "OK",
          allowOutsideClick: false,
        });
      });
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title className="">
          {entity ? "Editar Entidade" : "Adicionar Entidade"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {entityFields.map((fieldName) => {
            const field = fieldMappings.find((f) => f.name === fieldName);
            if (!field) return null;
            const isRequired = requiredFields.includes(fieldName);
            const isEmpty = emptyRequiredFields.includes(fieldName);
            return (
              <Form.Group
                key={field.name}
                className={isEmpty ? "has-error" : ""}
              >
                <FloatingLabel
                  controlId={field.name}
                  label={field.label}
                  className="shadow-input"
                >
                  {field.name === "ident_type" ? (
                    <Form.Select
                      name="ident_type"
                      value={entityData.ident_type || ""}
                      onChange={handleChange}
                    >
                      <option value="">Selecionar tipo de identificação</option>
                      {(identTypes.ident_types || []).map((type) => (
                        <option key={type.pk} value={type.pk}>
                          {type.value}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <>
                      <Form.Control
                        type="text"
                        name={field.name}
                        value={entityData[field.name] || ""}
                        onChange={handleChange}
                        placeholder=" "
                        className={`my-2 ${isRequired ? "required" : ""}`}
                      />
                      {isRequired && isEmpty && (
                        <Form.Text className="text-danger">
                          Campo obrigatório
                        </Form.Text>
                      )}
                    </>
                  )}
                </FloatingLabel>
              </Form.Group>
            );
          })}
          <Button type="submit" className="shadow-btn">
            {entity ? "Atualizar Entidade" : "Adicionar Entidade"}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddEditEntity;
