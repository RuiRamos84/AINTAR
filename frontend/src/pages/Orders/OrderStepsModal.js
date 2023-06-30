
import React, { useState, useEffect, useContext, useRef } from "react";
import { Modal, Button, Table, Form, Row, Col, FloatingLabel, Overlay, Tooltip } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import { fieldMappings } from "../../utils/Utils";
import { AlertContext } from "../../context/AlertContext";
import OrdersService from "../../services/OrderService";





const OrderStepModal = ({
  show,
  handleClose,
  orderStep,
  updateOrders,
  regnumber,
}) => {
  const [orderSteps, setorderSteps] = useState([]);
  const [memo, setMemo] = useState(""); // para o campo memo
  const [who, setWho] = useState(""); // para selecionar quem
  const [what, setWhat] = useState(""); // para selecionar o que
  const [whoList, setWhoList] = useState([]); // para a lista formatada de 'who'
  const [whatList, setWhatList] = useState([]); // para a lista formatada de 'what'
  const authContext = useContext(AuthContext);
  const [fileInputs, setFileInputs] = useState([{ file: null, description: "" }]);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTooltip, setActiveTooltip] = useState({
    target: null,
    text: "",
  });
  const { showAlert } = useContext(AlertContext);


const handleFileChange = (e, index) => {
  const { files } = e.target;
  if (files.length > 0) {
    const newFileInputs = [...fileInputs];
    newFileInputs[index].file = files[0];
    newFileInputs[index].description = ""; // Limpar o campo de descrição
    if (fileInputs.length >= 5) {
      setErrorMessage("Limite máximo de 5 arquivos por pedido.");
    } else {
      newFileInputs.push({ file: null, description: "" });
    }
    setFileInputs(newFileInputs);
    e.target.value = null; // Limpar o campo de arquivo
  }
};


const handleDescriptionChange = (e, index) => {
  const { value } = e.target;
  const newFileInputs = [...fileInputs];
  newFileInputs[index].description = value;
  setFileInputs(newFileInputs);
};


  // Atualize as listas formatadas sempre que o contexto for atualizado
  useEffect(() => {
    if (authContext.metadata) {
      setWhoList(
        authContext.metadata.who.map((whoItem) => ({
          value: whoItem.pk,
          label: whoItem.name,
        }))
      );
      setWhatList(
        authContext.metadata.what.map((whatItem) => ({
          value: whatItem.pk,
          label: whatItem.step,
        }))
      );
    }
  }, [authContext]);

  useEffect(() => {
    if (orderStep && orderStep.pk) {
      OrdersService.getDocumentStep(orderStep.pk)
        .then((res) => {
          setorderSteps(res.data.document_step);
        })        
        .catch((err) => {
          console.error(err);
        });
    }
  }, [orderStep]);



  const handleSave = async () => {
    if (!orderStep || orderStep.pk === null) {
      console.error("orderStep.pk é nulo!");
      return;
    }

    if (!orderSteps[0]) {
      console.error("orderSteps[0] é nulo ou indefinido!");
      return;
    }

    const tb_document_value = orderSteps[0].tb_document;
    const pk_order = orderSteps[0].pk;

    const formData = new FormData();
    formData.append("what", what);
    formData.append("who", who);
    formData.append("memo", memo);
    formData.append("tb_document", tb_document_value);

    fileInputs.forEach((fileInput, index) => {
      if (fileInput.file) {
        formData.append("files", fileInput.file);
        formData.append("descriptions", fileInput.description);
      }
    });

    try {
      const res = await OrdersService.createOrUpdateDocumentStep(
        pk_order,
        formData
      );
      console.log("Resposta da API:", res);

      if (memo) {
        showAlert(
          {
            variant: "success",
            message: `Observação adicionada: ${memo.slice(0, 20)}...`, // Mostra apenas os primeiros 20 caracteres da observação
          },
          true
        );
      }

      if (fileInputs.some((fileInput) => fileInput.file)) {
        showAlert(
          {
            variant: "success",
            message: "Arquivos adicionados com sucesso",
          },
          true
        );
      }

      const updatedData = await OrdersService.getDocumentStep(orderStep.pk);
      setorderSteps(updatedData.data.document_step);

      if (what && who) {

        authContext.socket.emit("forward_order", {
          userId: who,
          orderId: pk_order,
        });
        handleClose();
        updateOrders(true);
        showAlert(
          {
            variant: "success",
            message: `Pedido ${regnumber} foi encaminhado.`,
          },
          true
        );
      }

      setMemo("");
      setWho("");
      setWhat("");
      setFileInputs([{ file: null, description: "" }]);
    } catch (err) {
      console.error(err);
    }
  };




  const getLabel = (fieldName) => {
    const field = fieldMappings.find((field) => field.name === fieldName);
    return field ? field.label : fieldName;
  };

  function getIconByFilename(filename) {
    if (!filename) {
      return ""; // retorna algum ícone padrão ou nada
    }

    const extension = filename.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
        return "📊";
      case "jpg":
      case "jpeg":
      case "png":
        return "🖼️";
      case "zip":
      case "rar":
        return "🗜️";
      case "ppt":
      case "pptx":
        return "📽️";
      case "mov":
      case "mp4":
        return "🎞️";
      case "mp3":
        return "🎵";
      default:
        return "📁";
    }
  }




  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Modal.Title>
            Movimentos do Pedido - {regnumber && `${regnumber}`}
          </Modal.Title>
          <Button variant="primary" onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <FloatingLabel controlId="floatingTextarea2" label="Observações">
              <Form.Control
                as="textarea"
                rows={4}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder=" "
              />
            </FloatingLabel>
          </Form.Group>
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <FloatingLabel
                  controlId="floatingSelectGrid1"
                  label="Para Quem?"
                >
                  <Form.Select
                    value={who}
                    onChange={(e) => setWho(e.target.value)}
                    placeholder=" "
                  >
                    <option value="">Selecione...</option>
                    {whoList &&
                      whoList.map((whoItem, index) => (
                        <option key={index} value={whoItem.value}>
                          {whoItem.label}
                        </option>
                      ))}
                  </Form.Select>
                </FloatingLabel>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3">
                <FloatingLabel controlId="floatingSelectGrid2" label="Estado">
                  <Form.Select
                    value={what}
                    onChange={(e) => setWhat(e.target.value)}
                    placeholder=" "
                  >
                    <option value="">Selecione...</option>
                    {whatList &&
                      whatList.map((whatItem, index) => (
                        <option key={index} value={whatItem.value}>
                          {whatItem.label}
                        </option>
                      ))}
                  </Form.Select>
                </FloatingLabel>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              {fileInputs.map((fileInput, index) => (
                <div key={index}>
                  <Form.Group className="mb-3">
                    <Form.Label>Arquivo {index + 1}</Form.Label>
                    <Form.Control
                      type="file"
                      onChange={(e) => handleFileChange(e, index)}
                    />
                  </Form.Group>
                </div>
              ))}
            </Col>
            <Col>
              {fileInputs.map((fileInput, index) => (
                <div key={index}>
                  {fileInput.file && (
                    <Form.Group className="mb-3">
                      <Form.Label>Descrição do Arquivo {index + 1}</Form.Label>
                      <Form.Control
                        type="text"
                        value={fileInput.description}
                        onChange={(e) => handleDescriptionChange(e, index)}
                      />
                    </Form.Group>
                  )}
                </div>
              ))}
            </Col>
          </Row>
          {errorMessage && <p>{errorMessage}</p>}
        </Form>
        {orderSteps.length > 0 ? (
          <Table
            striped
            bordered
            hover
            responsive
            className="table table-responsive table-sm "
          >
            <thead className="table-dark">
              <tr>
                {Object.keys(orderSteps[0])
                  .filter(
                    (key) =>
                      key !== "pk" &&
                      key !== "tb_document" &&
                      key !== "ord" &&
                      key !== "descr"
                  )
                  .map((header, index) => (
                    <th key={index}>{getLabel(header)}</th>
                  ))}
              </tr>
            </thead>
            <tbody className="smallFont">
              {orderSteps.map((step, index) => (
                <tr key={index}>
                  {Object.entries(step)
                    .filter(
                      ([key]) =>
                        key !== "pk" &&
                        key !== "tb_document" &&
                        key !== "ord" &&
                        key !== "descr"
                    )
                    .map(([key, value], index) => {
                      let shouldShowTooltip = false;
                      let displayValue = value;

                      // Verificar se o campo atual é "memo" e se o valor tem mais de 20 caracteres
                      if (key === "memo" && value && value.length > 20) {
                        shouldShowTooltip = true;
                        displayValue = `${value.substring(0, 20)}...`; // Truncar o valor
                      }

                      return (
                        <td
                          key={index}
                          onMouseEnter={(event) =>
                            shouldShowTooltip &&
                            setActiveTooltip({
                              target: event.target,
                              text: value,
                            })
                          }
                          onMouseLeave={(event) =>
                            shouldShowTooltip &&
                            setActiveTooltip({ target: null, text: "" })
                          }
                        >
                          {key === "filename" ? (
                            <div style={{ textAlign: "center" }}>
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  OrdersService.downloadFile(
                                    regnumber,
                                    step.pk,
                                    value
                                  );
                                }}
                                title={value}
                                className="shadow-btn"
                              >
                                {getIconByFilename(value)}
                              </a>
                            </div>
                          ) : (
                            displayValue
                          )}
                          {shouldShowTooltip ? (
                            <Overlay
                              target={activeTooltip.target}
                              show={activeTooltip.target !== null}
                              placement="right"
                            >
                              {(props) => (
                                <Tooltip id="overlay-example" {...props}>
                                  {activeTooltip.text}
                                </Tooltip>
                              )}
                            </Overlay>
                          ) : null}
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p>Não existem passos do documento</p>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default OrderStepModal;
