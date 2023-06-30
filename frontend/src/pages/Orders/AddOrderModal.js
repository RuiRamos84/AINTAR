import React, { useState, useEffect, useContext, useRef, memo } from "react";
import { Modal, Button, FloatingLabel, Form } from "react-bootstrap";
import OrdersService from "../../services/OrderService";
import { AuthContext } from "../../context/AuthContext";
import { fieldMappings, getMetaData } from "../../utils/Utils";
import { getUserInfo, incrementOrderCount } from "../../services/authService";
import { AlertContext } from "../../context/AlertContext";
import AddEditEntity from "../Entitys/EntityAddModal";

const fieldNames = [
  "nipc",
  "tt_type",
  "ts_associate",
  "memo",
];
const AddEditOrderModal = ({ document, show, handleClose }) => {
  const { user } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const [typeOptions, setTypeOptions] = useState([]);
  const [associateOptions, setAssociateOptions] = useState([]);
  const [editedDocument, setEditedDocument] = useState(document);
  const [fileDescriptions, setFileDescriptions] = useState([]);
  const [files, setFiles] = useState([]);
  const authContext = useContext(AuthContext);
  const fileInput = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [fileObjects, setFileObjects] = useState([
    { file: null, description: "" },
  ]);



  const handleFieldChange = (fieldName, newValue) => {
    setEditedDocument({ ...editedDocument, [fieldName]: newValue });
  };

  const [documentData, setDocumentData] = useState({
    tt_type: "",
    ts_associate: "",
    memo: "",
    ...document,
  });

  const documentFieldMappings = fieldMappings.filter((field) =>
    fieldNames.includes(field.name)
  );

  const handleFileChange = (index, file) => {
    const newFileObjects = [...fileObjects];
    newFileObjects[index].file = file;
    if (newFileObjects.length - 1 === index && newFileObjects.length < 5) {
      newFileObjects.push({ file: null, description: "" });
    } else if (newFileObjects.length >= 5) {
      setErrorMessage("Limite máximo de 5 arquivos por pedido.");
    }
    setFileObjects(newFileObjects);
  };


  const handleDescriptionChange = (index, description) => {
    const newFileObjects = [...fileObjects];
    newFileObjects[index].description = description;
    setFileObjects(newFileObjects);
  };


  useEffect(() => {
    if (user?.profil === "3") {
      getUserInfo().then((userInfo) => {
        setDocumentData((prevDocumentData) => ({
          ...prevDocumentData,
          nipc: userInfo.user_info.nipc,
        }));
      });
    }

    getMetaData("types")
      .then(({ types }) => {
        const filteredTypes =
          user?.profil === "3" || user?.profil === "2"
            ? types.filter((t) => t.intern !== 1)
            : types;

        setTypeOptions(
          filteredTypes.map((t) => ({ value: t.pk, label: t.value }))
        );
      })
      .catch((err) => {
        console.error("Erro ao buscar metadados 'types':", err);
      });

    getMetaData("associates")
      .then(({ associates }) => {
        setAssociateOptions(
          associates.map((a) => ({ value: a.pk, label: a.name }))
        );
      })
      .catch((err) => {
        console.error("Erro ao buscar metadados 'associates':", err);
      });
  }, [user?.profil, user?.username]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "nipc" && user.profil === "3") {
      return;
    }
    console.log(`Atualizando o valor de ${name} para ${value}`);

    setDocumentData((prevDocumentData) => ({
      ...prevDocumentData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(documentData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("memo", documentData.memo);
    console.log(
      `Adicionando documento com os seguintes dados:`,
      documentData
    );
    // Adicione esta seção para adicionar os arquivos ao objeto FormData
    fileObjects.forEach((fileObject, index) => {
      if (fileObject.file) {
        formData.append("files", fileObject.file);
        formData.append("fileDescriptions", fileObject.description);
      }
    });
    OrdersService.addDocument(formData)
      .then((res) => {
        handleClose();
        const successMessage =
          res.data.message || "Pedido adicionado com sucesso!";
        showAlert({ variant: "success", message: successMessage });
        const order_id = res.data.order_id; // Verifique se o backend retorna o order_id

        // Emitir o evento "order_created" com o pedido e o who_id
        authContext.socket.emit("order_created", {
          order_id,
          who_id: res.data.who_id,
        });
      })
      .catch((err) => {
        const errorMessage =
          err.response && err.response.data && err.response.data.erro
            ? err.response.data.erro
            : "Erro ao adicionar o pedido.";
        showAlert({ variant: "danger", message: errorMessage });
        showAlert({
          icon: "error",
          title: "Erro ao criar o pedido",
          text: errorMessage,
          confirmButtonText: "OK",
          footer:
            '<a href="/entity">Deve criar primeiro entidade e só depois inserir o pedido.</a>',
        });
      });
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Adicionar Pedido</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit} key={show.toString()}>
          {documentFieldMappings.map((field) => (
            <Form.Group key={field.name}>
              <FloatingLabel
                controlId={field.name}
                label={field.label}
                className="shadow-input"
              >
                {field.name === "tt_type" || field.name === "ts_associate" ? (
                  <Form.Select
                    name={field.name}
                    value={documentData[field.name] || ""}
                    onChange={handleChange}
                    className="my-2"
                    placeholder=" "
                  >
                    <option value="">Selecione uma opção</option>
                    {(field.name === "tt_type"
                      ? typeOptions
                      : associateOptions
                    ).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                ) : (
                  <Form.Control
                    as={field.name === "memo" ? "textarea" : "input"}
                    name={field.name}
                    value={documentData[field.name] || ""}
                    disabled={field.name === "nipc" && user.profil === "3"}
                    onChange={handleChange}
                    placeholder=" "
                    className="my-2"
                  />
                )}
              </FloatingLabel>
            </Form.Group>
          ))}
          {fileObjects.map((fileObject, index) => (
            <div key={index}>
              <Form.Group className="mb-3">
                <FloatingLabel
                  controlId={`file-${index}`}
                  label={`Anexo ${index + 1}`}
                >
                  <Form.Control
                    type="file"
                    onChange={(e) => handleFileChange(index, e.target.files[0])}
                  />
                </FloatingLabel>
              </Form.Group>
              {fileObject.file && (
                <Form.Group className="mb-3">
                  <FloatingLabel
                    controlId={`file-description-${index}`}
                    label={`Descrição do Anexo ${index + 1}`}
                  >
                    <Form.Control
                      type="text"
                      value={fileObject.description}
                      onChange={(e) =>
                        handleDescriptionChange(index, e.target.value)
                      }
                    />
                  </FloatingLabel>
                </Form.Group>
              )}
              {fileObject.file &&
                index === fileObjects.length - 1 &&
                fileObjects.length < 5 && (
                  <Form.Group className="mb-3">
                    <FloatingLabel
                      controlId={`file-${index + 1}`}
                      label={`Anexo ${index + 2}`}
                    >
                      <Form.Control
                        type="file"
                        onChange={(e) =>
                          handleFileChange(index + 1, e.target.files[0])
                        }
                      />
                    </FloatingLabel>
                </Form.Group>
                )}
            </div>
          )
          )}
          {errorMessage && <p>{errorMessage}</p>} 
          <Button type="submit">Adicionar Pedido</Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddEditOrderModal;
