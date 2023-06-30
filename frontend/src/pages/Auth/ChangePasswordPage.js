import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { AlertContext } from "../../context/AlertContext"; // Importar AlertContext
import {
  Form,
  Button,
  InputGroup,
  FormControl,
  FloatingLabel,
} from "react-bootstrap";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";


const ChangePasswordPage = () => {
  const { changePassword } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext); // Usar o showAlert do AlertContext
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      showAlert({
        variant: "danger",
        message:
          "A nova Password e a confirmação da Password não correspondem.",
      });
      return;
    }
    try {
      await changePassword(oldPassword, newPassword);
      showAlert({
        variant: "success",
        message: "Password alterada com sucesso!",
      });
      navigate("/");
    } catch (error) {
      showAlert({
        variant: "danger",
        message: "Erro ao alterar a Password: " + error.message,
      });
    }
  };

  return (
    <div className="pr-container">
      <h1>Alterar Password</h1>
      <Form onSubmit={handleSubmit}>
        <FloatingLabel
          controlId="floatingOldPassword"
          label="Password Antiga"
          className="shadow-input my-2"
        >
          <FormControl
            type={showOldPassword ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder=" "
          />
          {showOldPassword ? (
            <AiFillEye
              className="eye-icon"
              onClick={() => setShowOldPassword(false)}
            />
            ) : (
            <AiFillEyeInvisible
              className="eye-icon"
              onClick={() => setShowOldPassword(true)}
            />            
          )}
        </FloatingLabel>

        <FloatingLabel
          controlId="floatingNewPassword"
          label="Nova Password"
          className="shadow-input my-2"
        >
          <FormControl
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder=" "
          />

          {showNewPassword ? (
            <AiFillEye
            className="eye-icon"
            onClick={() => setShowNewPassword(false)}
            />
            ) : (
            <AiFillEyeInvisible
              className="eye-icon"
              onClick={() => setShowNewPassword(true)}
            />
          )}
        </FloatingLabel>
        <FloatingLabel
          controlId="floatingConfirmPassword"
          label="Confirmação da Nova Password"
          className="shadow-input my-2"
        >
          <FormControl
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder=" "
          />
          {showConfirmPassword ? (
            <AiFillEye
              className="eye-icon"
              onClick={() => setShowConfirmPassword(false)}
            />
            ) : (
            <AiFillEyeInvisible
              className="eye-icon"
              onClick={() => setShowConfirmPassword(true)}
            />
          )}
        </FloatingLabel>
        <Button variant="primary" type="submit" className="shadow-btn my-2">
          Alterar Password
        </Button>
      </Form>
    </div>
  );
};

export default ChangePasswordPage;
