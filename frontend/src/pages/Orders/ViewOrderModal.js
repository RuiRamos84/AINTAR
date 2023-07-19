import React, { useContext, useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import { fieldMappings } from "../../utils/Utils";

const ViewOrderModal = ({ document: doc, show, handleClose }) => {
  const { user, metadata } = useContext(AuthContext);
  const [localDocument, setLocalDocument] = useState(doc);

  useEffect(() => {
    if (metadata && metadata.who && metadata.what && doc) {
      const whoInfo = metadata.who.find((who) => who.pk === doc.who);
      const whatInfo = metadata.what.find((what) => what.pk === doc.what);
      console.log(whatInfo)
      setLocalDocument((prevDocument) => ({
        ...prevDocument,
        who: whoInfo ? whoInfo.name : prevDocument.who,
        what: whatInfo ? whatInfo.step : prevDocument.what,
      }));
    }
  }, [metadata, doc]);

  const getLabel = (fieldName) => {
    const field = fieldMappings.find((field) => field.name === fieldName);
    return field ? field.label : fieldName;
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Detalhes do Pedido</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {Object.keys(localDocument).map((key) => {
          // Não renderizar campos específicos para o perfil 3
          if (
            user.profil === "3" &&
            (key === "type_countyear" ||
              key === "type_countall" ||
              key === "who" )
          )
            return null;
          if (key === "pk") return null;
          return (
            <p key={key}>
              <strong>{getLabel(key)}:</strong> {localDocument[key]}
            </p>
          );
        })}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewOrderModal;
