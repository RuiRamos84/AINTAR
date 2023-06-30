import React, { useState, useEffect, useCallback, useRef } from "react";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import { Navbar, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import DashboardService from "../../services/DashboardServices"; // substitua pelo caminho correto do arquivo

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef();
  const [menuItems, setMenuItems] = useState([]); // para armazenar os itens do menu

  useEffect(() => {
    // chama o método getmetadata aqui
    DashboardService.getmetadata()
      .then((data) => {
        // atualiza o estado com os dados retornados do método
        setMenuItems(data);
      })
      .catch((error) => {
        console.log("Erro ao obter os itens do menu", error);
      });
  }, []); // o array vazio como dependência faz com que este useEffect seja executado apenas uma vez após o primeiro render

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = useCallback((event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [handleClickOutside]);

  return (
    <Navbar
      ref={sidebarRef}
      bg="dark"
      variant="dark"
      onMouseEnter={() => setIsOpen(true)} // adiciona o evento onMouseEnter
      onMouseLeave={() => setIsOpen(false)} // adiciona o evento onMouseLeave
      style={{
        position: "fixed",
        left: 0,
        top: "48px", // altura da barra de navegação
        bottom: 0,
        transition: "all 0.5s ease",
        zIndex: 9999, // deve ser menor que o z-index da barra de navegação
        width: isOpen ? "auto" : "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "end",
        padding: "10px",
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)} // muda o estado ao clicar no ícone
        style={{ cursor: "pointer", alignSelf: "flex-end" }}
        className="btn-close-white"
      >
        {isOpen ? <AiOutlineClose size={24} /> : <AiOutlineMenu size={24} />}
      </div>

      {isOpen && (
        <div style={{ flexGrow: 1 }}>
          <Nav className="flex-column mt-3">
            {menuItems.map((item, index) => (
              <Nav.Link key={index} href={`/dashboard/${item.pk}`}>
                {item.name}
              </Nav.Link>
            ))}
          </Nav>
        </div>
      )}
    </Navbar>
  );
};

export default Sidebar;
