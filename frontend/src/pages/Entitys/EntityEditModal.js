import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { fieldMappings } from "../../utils/Utils";

const EntityEditModal = ({ entity, onUpdate }) => {
  const [editedEntity, setEditedEntity] = useState(entity);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    if (entity) {
      setEditedEntity(entity);
    } else {
      // Aqui, você está criando um objeto com todas as chaves de "entity",
      // mas com todos os valores definidos como vazios.
      const emptyEntity = Object.fromEntries(
        Object.keys(entity).map((key) => [key, ""])
      );
      setEditedEntity(emptyEntity);
    }
  }, [entity]);



  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditedEntity({ ...editedEntity, [name]: value });
  };

  const handleUpdate = () => {
    onUpdate(editedEntity);
    handleClose();
  };

  const handleClose = () => {
    setEditedEntity(entity);
    setShowModal(false);
  };

  const getLabel = (fieldName) => {
    const field = fieldMappings.find((field) => field.name === fieldName);
    return field ? field.label : fieldName;
  };

  return (
    <Modal show={showModal} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Editar Entidade</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {Object.keys(editedEntity).map((key, index) => {
            if (key === "pk") return null; // Ignora a chave 'pk'

            return (
              <Form.Group
                controlId={`form${key}${index}`}
                key={`form${key}${index}`}
              >
                <Form.Label>{getLabel(key)}</Form.Label>
                <Form.Control
                  type="text"
                  name={key}
                  value={editedEntity[key] || ""}
                  onChange={handleInputChange}
                />
              </Form.Group>
            );
          })}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleUpdate}>
          Atualizar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EntityEditModal;
