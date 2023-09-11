import React, { useState, useEffect } from "react";
import { Modal, Button, Form, FloatingLabel } from "react-bootstrap";
import EntityService from "../../services/EntityService";
import { fieldMappings } from "../../utils/Utils";

const AddEditEntity = ({ entity, onClose, identTypes, entityFields }) => {
  const [entityData, setEntityData] = useState(
    entityFields.reduce((obj, field) => {
      obj[field] = entity ? entity[field] : "";
      return obj;
    }, {})
  );

  useEffect(() => {
    setEntityData(entity || {});
  }, [entity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntityData((prevEntityData) => ({
      ...prevEntityData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = entity
      ? EntityService.updateEntity
      : EntityService.addEntity;

    action(entityData)
      .then((res) => {
        onClose();
      })
      .catch((err) => {
        console.error(err);
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
            return (
              <Form.Group key={field.name}>
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
                    <Form.Control
                      type="text"
                      name={field.name}
                      value={entityData[field.name] || ""}
                      onChange={handleChange}
                      placeholder=" "
                      className="my-2"
                    />
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
