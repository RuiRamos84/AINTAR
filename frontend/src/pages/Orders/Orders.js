import React, { useEffect, useState } from "react";
import { Table, Button, Pagination, Container, Row } from "react-bootstrap";
import { InfoSquare, CaretUpFill, CaretDownFill, BarChartSteps} from "react-bootstrap-icons";
import OrdersService from "../../services/OrderService";
import SearchBar from "../SearchBar/SearchBar";
import AddEditOrderModal from "./AddOrderModal";
import ViewDocumentModal from "./ViewOrderModal";
import ViewOrderSteps from "./ViewOrderSteps";
import { fieldMappings } from "../../utils/Utils"
import OrderStepModal from "./OrderStepsModal";

const OrdersList = () => {
  const [documents, setDocuments] = useState([]);
  const [editingDocument, setEditingDocument] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [documentsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const pageNumbers = [];
  const totalPages = Math.ceil(filteredResults.length / documentsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [showStepsModal, setShowStepsModal] = useState(false);

  const displayFields = [
    "regnumber",
    "nipc",
    "ts_entity",
    "ts_associate",
    "tt_type",
    "submission",
  ];

  const fetchDocuments = () => {
    OrdersService.getDocuments()
      .then((res) => {
        setDocuments(res.data.documents);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useEffect(fetchDocuments, []);

  // Função para abrir o modal de adição
  const handleAddClick = () => {
    setEditingDocument(null);
    setShowAddModal(true);
  };

  // Função para abrir o modal de visualização de informações detalhadas
  const handleInfoClick = (document) => {
    setEditingDocument(document);
    setShowViewModal(true);
    setShowStepsModal(false);
  };

  // Função para abrir o modal de visualização de passos
  const handleStepsClick = (document) => {
    setEditingDocument(document);
    setShowStepsModal(true);
    setShowViewModal(false);
  };

  // Função para fechar os modais
  const handleModalClose = () => {
    setShowAddModal(false);
    setShowViewModal(false);
    setShowStepsModal(false);
    fetchDocuments();
  };

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = filteredResults.slice(
    indexOfFirstDocument,
    indexOfLastDocument
  );

  const indexOfLastEntity = currentPage * documentsPerPage;
  const indexOfFirstEntity = indexOfLastEntity - documentsPerPage;
  const currentEntities = filteredResults.slice(
    indexOfFirstEntity,
    indexOfLastEntity
  );

  if (totalPages > 1) {
    const maxVisiblePages = 3; // Defina o número máximo de páginas visíveis

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(
        <Pagination.Item key={1} onClick={() => paginate(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        pageNumbers.push(<Pagination.Ellipsis key="startEllipsis" />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => paginate(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(<Pagination.Ellipsis key="endEllipsis" />);
      }
      pageNumbers.push(
        <Pagination.Item key={totalPages} onClick={() => paginate(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }
  }

  useEffect(() => {
    const updateFilteredResults = () => {
      let filteredDocuments = documents.filter((linha) =>
        Object.values(linha).some(
          (valor) =>
            valor !== null &&
            valor.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

      if (sortColumn) {
        filteredDocuments.sort((a, b) => {
          const valueA = (a[sortColumn] || "").toString().toLowerCase();
          const valueB = (b[sortColumn] || "").toString().toLowerCase();
          return (
            valueA.localeCompare(valueB, "pt", { sensitivity: "base" }) *
            (sortDirection === "asc" ? 1 : -1)
          );
        });
      }

      setFilteredResults(filteredDocuments);
    };

    updateFilteredResults();
    setCurrentPage(1);
  }, [searchTerm, documents, sortColumn, sortDirection]); // Adicione sortColumn e sortDirection às dependências

  // Remova a lógica de classificação ao renderizar o componente, já que agora os documentos já estão classificados
  const sortedDocuments = currentDocuments;

  const renderSortCaret = (column) => {
    if (column === sortColumn) {
      if (sortDirection === "asc") {
        return <CaretUpFill />;
      } else {
        return <CaretDownFill />;
      }
    }
    return null;
  };

  const getLabel = (fieldName) => {
    const field = fieldMappings.find((field) => field.name === fieldName);
    return field ? field.label : fieldName;
  };

  return (
    <div className="en-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Todos os Pedidos</h1>
        <div style={{ display: "flex", alignItems: "center" }}>
          <SearchBar onSearch={setSearchTerm} className="shadow-input" />
          <Button variant="none" onClick={handleAddClick}>
            Adicionar
          </Button>
        </div>
      </div>
      <div className="table-responsive">
        <Table striped bordered hover className="relative-container table-sm">
          <thead className="table-dark">
            <tr>
              {displayFields.map((fieldName) => (
                <th key={fieldName} onClick={() => handleSort(fieldName)}>
                  {getLabel(fieldName)} {renderSortCaret(fieldName)}
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody className="text-center">
            {sortedDocuments.map((document) => (
              <tr key={document.pk}>
                {displayFields
                  .map((fieldName) =>
                    fieldMappings.find((field) => field.name === fieldName)
                  )
                  .map((field) => (
                    <td key={field.name}>{document[field.name]}</td>
                  ))}
                <td>
                  <Button
                    variant="none"
                    onClick={() => {
                      handleStepsClick(document);
                      setShowStepsModal(true);
                      setShowViewModal(false);
                    }}
                  >
                    <BarChartSteps />
                  </Button>
                  <Button
                    variant="none"
                    onClick={() => {
                      handleInfoClick(document);
                      setShowViewModal(true);
                      setShowStepsModal(false);
                    }}
                  >
                    <InfoSquare />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <Container>
        <Row className="justify-content-center">
          <Pagination
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Pagination.First
              disabled={currentPage === 1}
              onClick={() => paginate(1)}
            />
            <Pagination.Prev
              disabled={currentPage === 1}
              onClick={() => paginate(currentPage - 1)}
            />
            {pageNumbers}
            <Pagination.Next
              disabled={currentPage === totalPages}
              onClick={() => paginate(currentPage + 1)}
            />
            <Pagination.Last
              disabled={currentPage === totalPages}
              onClick={() => paginate(totalPages)}
            />
          </Pagination>
        </Row>
      </Container>
      {showAddModal && (
        <AddEditOrderModal
          document={editingDocument}
          show={showAddModal}
          handleClose={handleModalClose}
        />
      )}
      {showViewModal && editingDocument && (
        <ViewDocumentModal
          document={editingDocument}
          show={showViewModal}
          handleClose={handleModalClose}
        />
      )}
      {showStepsModal && editingDocument && (
        <ViewOrderSteps
          show={showStepsModal}
          handleClose={() => setShowStepsModal(false)}
          orderStep={editingDocument}
          regnumber={editingDocument ? editingDocument.regnumber : null}
        />
      )}
    </div>
  );
};

export default OrdersList;
