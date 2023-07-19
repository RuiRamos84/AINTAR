import React, { createContext, useState, useCallback, useEffect } from "react";
import Swal from "sweetalert2";
import { Alert } from "react-bootstrap";
import { Transition } from "react-transition-group";
import "./AlertContext.css";

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({ show: false, variant: "", message: "" });
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    if (alert.show) {
      setShowing(true);
      const timeout = setTimeout(() => {
        setShowing(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [alert]);

  const showAlert = useCallback((options) => {
    if (options.variant && options.message) {
      setAlert({
        show: true,
        variant: options.variant,
        message: options.message,        
      });
    } else if (options.icon && options.title) {
      Swal.fire({
        icon: options.icon,
        position: options.position || "center",
        title: options.title,
        timer: options.timer,
        text: options.text,
        showConfirmButton: options.text,
        confirmButtonText: options.confirmButtonText,
        willClose: options.willClose,
        allowOutsideClick: options.text,
        footer: options.footer,
      
      });
    } else {
      console.error("Opções inválidas para showAlert");
    }
  }, []);

  const duration = 2800;

  const defaultStyle = {
    transition: `opacity ${duration}ms ease-in-out`,
    opacity: 0,
  };

  const transitionStyles = {
    entering: { opacity: 1 },
    entered: { opacity: 1 },
    exiting: { opacity: 0 },
    exited: { opacity: 0 },
  };

  return (
    <AlertContext.Provider value={{ alert, showAlert }}>
      <Transition in={showing} timeout={duration}>
        {(state) => (
          <div
            style={{
              ...defaultStyle,
              ...transitionStyles[state],
            }}
            className="alert-container"
          >
            <Alert variant={alert.variant}>{alert.message}</Alert>
          </div>
        )}
      </Transition>
      {children}
    </AlertContext.Provider>
  );
};
