import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Alert } from "react-bootstrap";
import { Transition } from "react-transition-group";
import Swal from "sweetalert2";
import "./AlertContext.css";

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({ show: false, variant: "", message: "" });
  const [showing, setShowing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  // const alertRef = useRef(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (alert.show) {
      setShowing(true);
      const timeout = setTimeout(() => {
        setShowing(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [alert]);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setFadeOut(true);
      }, 3000);

      setTimeout(() => {
        setIsVisible(false);
      }, 6000);
    }
  }, [isVisible]);

  const showAlert = useCallback((options) => {
    if (options.variant && options.message) {
      setAlert({
        show: true,
        variant: options.variant,
        message: options.message,
      });
    } else if (options.icon && options.title) {
      setIsVisible(true);

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
      }).then(() => {
        setIsVisible(false);
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
      <Transition in={showing || isVisible} timeout={duration}>
        {(state) => (
          <div
            style={{
              ...defaultStyle,
              ...transitionStyles[state],
            }}
            className="alert-container"
          >
            {alert.variant ? (
              <Alert variant={alert.variant}>{alert.message}</Alert>
            ) : null}            
          </div>
        )}
      </Transition>
      {children}
    </AlertContext.Provider>
  );
};
