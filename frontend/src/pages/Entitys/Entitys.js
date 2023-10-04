import React, { useEffect, useState } from "react";
import { Table, Button, Pagination, Container, Row, Spinner } from "react-bootstrap";
import {
  PencilSquare,
  CaretUpFill,
  CaretDownFill,
} from "react-bootstrap-icons";
import EntityService from "../../services/EntityService";
import AddEditEntityModal from "./EntityAddModal";
import SearchBar from "../SearchBar/SearchBar";
import { fieldMappings } from "../../utils/Utils";

const EntitiesList = () => {
  const [entities, setEntities] = useState([]);
  const [identTypes, setIdentTypes] = useState([]);
  const [editingEntity, setEditingEntity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entitiesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [loading, setLoading] = useState(true);
  const pageNumbers = [];
  const totalPages = Math.ceil(filteredResults.length / entitiesPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const [entityFields, setEntityFields] = useState([]);




  const fetchEntities = () => {
    setLoading(true);
    EntityService.getEntities()
      .then((res) => {
        setEntities(res.data.entities);
        setIdentTypes(res.data.ident_type);

        // Obtenha os títulos das colunas
        const columns = Object.keys(res.data.entities[0]);

        // Mapeie os campos de dropdown com suas opções
        const dropdownFields = fieldMappings.filter(
          (field) => field.type === "dropdown"
        );
        dropdownFields.forEach((field) => {
          field.options = res.data[field.name];
        });

        // Combine os campos de entrada e os campos de dropdown
        const allFields = [...columns, ...dropdownFields];
        setEntityFields(allFields);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false); // Desativar o estado de carregamento, independentemente do resultado
      });
  };


  useEffect(fetchEntities, []);

  const handleAddClick = () => {
    setEditingEntity(null);
    setShowModal(true);
  };

  const handleEditClick = (entity) => {
    setEditingEntity(entity);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    fetchEntities();
  };

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const indexOfLastEntity = currentPage * entitiesPerPage;
  const indexOfFirstEntity = indexOfLastEntity - entitiesPerPage;
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
      setFilteredResults(
        entities.filter((linha) =>
          Object.values(linha).some(
            (valor) =>
              valor !== null &&
              valor.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      );
    };
    updateFilteredResults();
    setCurrentPage(1);
  }, [searchTerm, entities]);

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

  const sortedEntities = filteredResults.sort((a, b) => {
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
        <h1>Entidades</h1>
        <div style={{ display: "flex", alignItems: "center" }}>
          <SearchBar className="shadow-input" onSearch={setSearchTerm} />
          <Button onClick={handleAddClick} className="shadow-btn">
            Adicionar Entidade
          </Button>
        </div>
      </div>

      {loading ? ( // Renderizar o spinner enquanto estiver carregando
        <div class="d-flex justify-content-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p>&nbsp;&nbsp;&nbsp;A carregar...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table
              striped
              bordered
              hover
              className="relative-container table-sm"
            >
              <thead className="table-dark">
                <tr>
                  <th onClick={() => handleSort("nipc")}>
                    NIF {renderSortCaret("nipc")}
                  </th>
                  <th onClick={() => handleSort("name")}>
                    Nome {renderSortCaret("name")}
                  </th>
                  <th onClick={() => handleSort("phone")}>
                    Telefone {renderSortCaret("phone")}
                  </th>
                  <th onClick={() => handleSort("email")}>
                    Email {renderSortCaret("email")}
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="text-center">
                {currentEntities.map((entity) => (
                  <tr key={entity.pk}>
                    <td>{entity.nipc}</td>
                    <td>{entity.name}</td>
                    <td>{entity.phone}</td>
                    <td>{entity.email}</td>
                    <td>
                      <Button
                        variant="none"
                        onClick={() => handleEditClick(entity)}
                      >
                        <PencilSquare />
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
        </>
      )}
      {showModal && (
        <AddEditEntityModal
          entity={editingEntity}
          onClose={handleModalClose}
          identTypes={identTypes}
          entityFields={entityFields}
        />
      )}
    </div>
  );
};

export default EntitiesList;
