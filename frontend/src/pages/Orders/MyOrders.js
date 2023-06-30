import React, { useEffect, useState, useContext } from "react";
import { Table, Button, Pagination, Container, Row } from "react-bootstrap";
import {
  PencilSquare,
  CaretUpFill,
  CaretDownFill,
  InfoSquare,
} from "react-bootstrap-icons";
import OrdersService from "../../services/OrderService";
import SearchBar from "../SearchBar/SearchBar";
import AddDocumentModal from "./AddOrderModal";
import ViewDocumentModal from "./ViewOrderModal";
import { fieldMappings } from "../../utils/Utils";
import OrderStepModal from "./OrderStepsModal";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";


const MyOrdersList = () => {
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
  const { getMetaData, setMetadata } = useContext(AuthContext);
  const [isOrderUpdated, setIsOrderUpdated] = useState(false);
  const { user } = useContext(AuthContext);
  const { resetOrderCount } = useContext(NotificationContext);
  


  const displayFields = [
    "regnumber",
    "nipc",
    "ts_entity",
    "ts_associate",
    "tt_type",
    "submission",
  ];

  const fetchDocuments = async () => {
    try {
      const documentsResponse = await OrdersService.getMyRequests();
      const metadataResponse = await getMetaData("order");
      const userDocuments = documentsResponse.data.document_self.filter(
        (document) => document.who === user.user_id
      );
      setDocuments(userDocuments);
      setMetadata(metadataResponse);
    } catch (err) {
      console.error(err);
    }
  };


    useEffect(() => {
      fetchDocuments();
      resetOrderCount();
    }, []);

    useEffect(() => {
      if (isOrderUpdated) {
        fetchDocuments();
        setIsOrderUpdated(false); // Redefinir para falso
        resetOrderCount();
      }
    }, [isOrderUpdated]);




  // Função para abrir o modal de adição
  const handleAddClick = () => {
    setEditingDocument(null);
    setShowAddModal(true);
  };

  // Função para abrir o modal de visualização
  const handleViewClick = (document) => {
    setEditingDocument(document);
    setShowViewModal(true);
  };

  // Função para fechar os modais
  const handleModalClose = () => {
    setShowAddModal(false);
    setShowViewModal(false);
    handleOrderStepModalClose(false);
  };

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const [showOrderStepModal, handleOrderStepModalClose] = useState(false);

  const handleHistoryClick = (document) => {
    setEditingDocument(document);
    handleOrderStepModalClose(true);
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
      if (Array.isArray(documents)) {
        setFilteredResults(
          documents.filter((linha) =>
            Object.values(linha).some(
              (valor) =>
                valor !== null &&
                valor.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
          )
        );
      }
    };
    updateFilteredResults();
    setCurrentPage(1);
  }, [searchTerm, documents]);


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

  const sortedDocuments = currentDocuments.sort((a, b) => {
    if (sortColumn) {
      const valueA = (a[sortColumn] || "").toString().toLowerCase();
      const valueB = (b[sortColumn] || "").toString().toLowerCase();
      return (
        valueA.localeCompare(valueB, "pt", { sensitivity: "base" }) *
        (sortDirection === "asc" ? 1 : -1)
      );
    }
    return 0;
  });

  return (
    <div className="en-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Os Meus Pedidos</h1>
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
            {sortedDocuments.length > 0 ? (
              sortedDocuments.map((document) => (
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
                      onClick={() => handleViewClick(document)}
                    >
                      <InfoSquare />
                    </Button>
                    <Button
                      variant="none"
                      onClick={() => handleHistoryClick(document)}
                    >
                      <PencilSquare />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={displayFields.length + 2}>
                  Não há mais pedidos para tratar.
                </td>
              </tr>
            )}
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
        <AddDocumentModal
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
      {showOrderStepModal && editingDocument && (
        <OrderStepModal
          orderStep={editingDocument}
          show={showOrderStepModal}
          regnumber={editingDocument ? editingDocument.regnumber : null}
          handleClose={() => handleOrderStepModalClose(false)}
          updateOrders={setIsOrderUpdated}
        />
      )}
    </div>
  );
};

export default MyOrdersList;
