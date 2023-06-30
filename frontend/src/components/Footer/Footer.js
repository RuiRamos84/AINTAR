import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Footer = () => {
  return (
    <Container>
      <footer className="bg-light mt-auto footer">
        <Row>
          <Col>
            <div className="container">
              © {new Date().getFullYear()} AINTAR. Todos os direitos reservados.
            </div>
          </Col>
        </Row>
      </footer>
    </Container>
  );
};

export default Footer;
