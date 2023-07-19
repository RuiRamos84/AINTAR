import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { AlertContext } from "../../context/AlertContext";
import { Container } from "react-bootstrap";
import { Navbar, Nav, Image, Dropdown } from "react-bootstrap";
import { NotificationContext } from "../../context/NotificationContext";
import LoginModal from "../../pages/Auth/LoginPage";
import UserModal from "../../pages/Auth/UserModal";
import AddEditOrderModal from "../../pages/Orders/AddOrderModal";
import manAvatar from "../../assets/man.png";
import logo from "../../assets/logo.png";



const AppNavbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const navigate = useNavigate(useNavigate);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  const { orderCount } = useContext(NotificationContext);
  useEffect(() => {
    if (orderCount > 0) {
      document.title = `(${orderCount}) AINTAR - Tem um novo pedido.`;
    } else {
      document.title = "AINTAR";
    }
  }, [orderCount]);

  


  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  };

  const handleShowLoginModal = () => {
    setShowLoginModal(true);
  };

  const handleCloseRegisterModal = () => {
    setShowRegisterModal(false);
  };

  const handleShowRegisterModal = () => {
    setShowRegisterModal(true);
  };

  const handleShowAddOrderModal = () => {
    setShowAddOrderModal(true);
  };

  const handleCloseAddOrderModal = () => {
    setShowAddOrderModal(false);
  };

  const handleLogout = () => {
    logout();
    showAlert({ variant: "success", message: "Logout realizado com sucesso!" });
    navigate("/");
  };

  const handleUserSubmit = (userData) => {
    console.log(userData);
    setShowRegisterModal(false);
  };

  const switchToRegisterModal = () => {
    handleCloseLoginModal();
    handleShowRegisterModal();
  };

  const switchToLoginModal = () => {
    handleCloseRegisterModal();
    handleShowLoginModal();
  };

  return (
    <>
      <Navbar
        bg="dark"
        variant="dark"
        expand="lg"
        className="justify-content-between sticky-sm-top"
      >
        <Container style={{ maxWidth: "90%" }}>
          <Navbar.Brand href="/">
            <Image src={logo} height="30" alt="Logo" />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse
            id="basic-navbar-nav"
            className="justify-content-end"
          >
            <Nav className="mr-auto">
              <Nav.Link href="/">Home</Nav.Link>
              {/* <Nav.Link href="/about">About</Nav.Link> */}
              {user && user.profil === "1" && (
                <Nav.Link href="/entity">Entidades</Nav.Link>
              )}
              {user && (user.profil === "1" || user.profil === "2") && (
                <>
                  <Nav.Link href="/dashboard">Dashboard</Nav.Link>
                  <Nav.Link href="/my_orders_tasks">
                    Tarefas 
                    {orderCount > 0 && (
                      <span className="badge rounded-pill bg-danger ms-1">
                        {orderCount < 100 ? orderCount : "99+"}
                      </span>
                    )}
                  </Nav.Link>
                </>
              )}
              {user &&
                (user.profil === "1" ||
                  user.profil === "2" ||
                  user.profil === "3") && (
                  <div className="d-flex align-items-center">
                    <Dropdown onToggle={(isOpen) => setIsDropdownOpen(isOpen)}>
                      <Dropdown.Toggle
                        as={Nav.Link}
                        id="dropdown-projects"
                        className="d-flex align-items-center justify-content-end"
                      >
                        Pedidos
                      </Dropdown.Toggle>
                      <Dropdown.Menu
                        className="dropdown-menu-end"
                        variant="dark"
                      >
                        <Dropdown.Item onClick={handleShowAddOrderModal}>
                          Novo Pedido
                        </Dropdown.Item>
                        {user.profil === "1" && (
                          <Dropdown.Item
                            as={Link}
                            to="/my_orders"
                            className="d-flex align-items-center justify-content-between"
                          >
                            <div>Meus Pedidos</div>
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item as={Link} to="/orders">
                          Todos os Pedidos
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                )}
            </Nav>
            <Nav>
              {user ? (
                <>
                  <Dropdown>
                    <Dropdown.Toggle
                      as={Nav.Link}
                      id="dropdown-profile"
                      className="custom-dropdown-toggle"
                    >
                      <Image
                        src={manAvatar}
                        width="20px"
                        height="20px"
                        className="rounded-circle"
                        alt="Avatar"
                      />

                      {user.user_name}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="dropdown-menu-end" variant="dark">
                      <Dropdown.Item as={Link} to="/perfil">
                        Perfil
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/change_password">
                        Alterar Password
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={handleLogout}>
                        Logout
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              ) : (
                <>
                  <Nav.Link onClick={handleShowLoginModal}>Login</Nav.Link>
                  <Nav.Link onClick={handleShowRegisterModal}>
                    Registrar
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {user && (
        <AddEditOrderModal
          show={showAddOrderModal}
          handleClose={handleCloseAddOrderModal}
        />
      )}
      <LoginModal
        showModal={showLoginModal}
        handleCloseModal={handleCloseLoginModal}
        switchToRegisterModal={switchToRegisterModal}
      />
      <UserModal
        showModal={showRegisterModal}
        handleCloseModal={handleCloseRegisterModal}
        handleSubmit={handleUserSubmit}
        switchToLoginModal={switchToLoginModal}
      />
    </>
  );
};

export default AppNavbar;
