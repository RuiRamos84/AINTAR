
import React, { useState, useEffect, useContext } from "react";
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
import { AuthContext } from "../../context/AuthContext";
import { fieldMappings } from "../../utils/Utils";
import { AlertContext } from "../../context/AlertContext";
import OrdersService from "../../services/OrderService";


const ViewOrderSteps = ({
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
  const [fileInputs, setFileInputs] = useState([
    { file: null, description: "" },
  ]);
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
      if (fileInputs.length < 5) {
        newFileInputs.push({ file: null, description: "" });
      } else {
        setErrorMessage("Limite máximo de 5 arquivos iniciais por pedido.");
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

  const handleRemoveFile = (index) => {
    const newFileInputs = [...fileInputs];
    newFileInputs.splice(index, 1);
    if (newFileInputs.length === 0) {
      newFileInputs.push({ file: null, description: "" });
    }
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
        </div>
      </Modal.Header>
      <Modal.Body>        
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
                <tr
                  key={index}
                  className={step.filename ? "has-attachment" : ""}
                >
                  {Object.entries(step)
                    .filter(
                      (entry) =>
                        !["pk", "tb_document", "ord", "descr"].includes(
                          entry[0]
                        )
                    )
                    .map(([key, value], index) => {
                      let shouldShowTooltip = false;
                      let displayValue = value;

                      if (key === "memo" && value && value.length > 20) {
                        shouldShowTooltip = true;
                        displayValue = `${value.substring(0, 20)}...`;
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
                              {step.filename ? ( // Verifica se há um anexo
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    OrdersService.downloadFile(
                                      regnumber,
                                      step.pk,
                                      value
                                    );
                                  }}
                                  title={value}
                                  className="shadow-btn border"
                                >
                                  {getIconByFilename(value)}
                                </button>
                              ) : (
                                // Se não houver anexo, exibe apenas o ícone
                                getIconByFilename(value)
                              )}
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

export default ViewOrderSteps;
