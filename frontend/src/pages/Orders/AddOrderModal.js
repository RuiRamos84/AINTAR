import React, { useState, useEffect, useContext, useRef, memo } from "react";
import {
  InputGroup,
  Modal,
  Button,
  Table,
  Form,
  Row,
  Col,
  FloatingLabel,
  Overlay,
  Tooltip,
  FormControl,
} from "react-bootstrap";
import { BsTrash, BsFolderPlus } from "react-icons/bs";
import OrdersService from "../../services/OrderService";
import { AuthContext } from "../../context/AuthContext";
import { fieldMappings, getMetaData } from "../../utils/Utils";
import { getUserInfo, incrementOrderCount } from "../../services/authService";
import { AlertContext } from "../../context/AlertContext";
import AddEditEntity from "../Entitys/EntityAddModal";

const fieldNames = ["nipc", "tt_type", "ts_associate", "memo"];
const AddEditOrderModal = ({ document, show, handleClose }) => {
  const { user } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const [typeOptions, setTypeOptions] = useState([]);
  const [associateOptions, setAssociateOptions] = useState([]);
  const [editedDocument, setEditedDocument] = useState(document);
  const authContext = useContext(AuthContext);
  const [fileInputs, setFileInputs] = useState([
    { file: null, description: "" },
  ]);
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

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    const newFileObjects = [...fileObjects];
    newFileObjects[index].file = file;

    const newFileInputs = [...fileInputs];
    newFileInputs[index].file = file;

    if (newFileObjects.length - 1 === index && newFileObjects.length < 5) {
      newFileObjects.push({ file: null, description: "" });
      newFileInputs.push({ file: null, description: "" });
    } else if (newFileObjects.length >= 5) {
      setErrorMessage("Limite máximo de 5 arquivos por pedido.");
    }

    setFileObjects(newFileObjects);
    setFileInputs(newFileInputs);
  };


  const handleRemoveFile = (index) => {
    const newFileInputs = [...fileInputs];
    newFileInputs.splice(index, 1);
    if (newFileInputs.length === 0) {
      newFileInputs.push({ file: null, description: "" });
    }
    setFileInputs(newFileInputs);
  };

  const handleDescriptionChange = (e, index) => {
    const description = e.target.value;

    const newFileObjects = [...fileObjects];
    const newFileInputs = [...fileInputs];

    // Verificando se o objeto existe antes de definir a descrição
    if (newFileObjects[index] && newFileInputs[index]) {
      newFileObjects[index].description = description;
      newFileInputs[index].description = description;

      setFileObjects(newFileObjects);
      setFileInputs(newFileInputs);
    } else {
      console.error(
        `Não foi possível encontrar um objeto de arquivo no índice ${index}`
      );
    }
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
    // console.log(`Atualizando o valor de ${name} para ${value}`);

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
    // console.log(`Adicionando documento com os seguintes dados:`, documentData);
    fileObjects.forEach((fileObject, index) => {
      if (fileObject.file) {
        formData.append("files", fileObject.file);
        formData.append("fileDescriptions", fileObject.description);
      }
    });
    // console.log([...formData.entries()]);
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
            '<a href="/entity">Deve criar primeiro a entidade e só depois inserir o pedido.</a>',
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
          {fileInputs.map((fileInput, index) => {
            const fileInputRef = React.createRef();

            return (
              <Row key={index}>
                <Col>
                  <Form.Group className="mb-3">
                    <InputGroup>
                      <InputGroup.Text>
                        <BsFolderPlus
                          size={16}
                          style={{ cursor: "pointer" }}
                          onClick={() => fileInputRef.current.click()}
                        />
                      </InputGroup.Text>
                      <FloatingLabel
                        controlId={`floatingFileInput${index}`}
                        label={`${index + 1}º Arquivo `}
                      >
                        <FormControl
                          type="text"
                          value={fileInput.file ? fileInput.file.name : ""}
                          placeholder="Nenhum arquivo selecionado"
                          readOnly
                        />
                      </FloatingLabel>
                      <FormControl
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileChange(e, index)}
                        hidden
                      />
                      {fileInput.file && (
                        <InputGroup.Text
                          onClick={() => handleRemoveFile(index)}
                        >
                          <BsTrash hover/>
                        </InputGroup.Text>
                      )}
                    </InputGroup>
                  </Form.Group>
                  {fileInput.file && (
                    <Form.Group className="mb-3">
                      <FloatingLabel
                        controlId={`floatingDescription${index}`}
                        label={`Descrição do Arquivo ${index + 1}º`}
                      >
                        <Form.Control
                          type="text"
                          value={fileInput.description || ""}
                          onChange={(e) => handleDescriptionChange(e, index)}
                          placeholder=" "
                        />
                      </FloatingLabel>
                    </Form.Group>
                  )}
                </Col>
              </Row>
            );
          })}

          {errorMessage && <p>{errorMessage}</p>}
          <Button type="submit">Adicionar Pedido</Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddEditOrderModal;
