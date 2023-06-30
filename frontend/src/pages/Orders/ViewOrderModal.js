import React, { useContext, useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import { fieldMappings } from "../../utils/Utils";

const ViewOrderModal = ({ document: doc, show, handleClose }) => {
  const authContext = useContext(AuthContext);
  const [localDocument, setLocalDocument] = useState(doc);


  useEffect(() => {
    if (
      authContext.metadata &&
      authContext.metadata.who &&
      authContext.metadata.what &&
      doc
    ) {
      const whoInfo = authContext.metadata.who.find(
        (who) => who.pk === doc.who
      );
      const whatInfo = authContext.metadata.what.find(
        (what) => what.pk === doc.what
      );
      setLocalDocument((prevDocument) => ({
        ...prevDocument,
        who: whoInfo ? whoInfo.name : prevDocument.who,
        what: whatInfo ? whatInfo.step : prevDocument.what,
      }));
    }
  }, [authContext, doc]);



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
