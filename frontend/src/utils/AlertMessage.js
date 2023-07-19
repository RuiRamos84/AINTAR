import React, { useEffect, useState, useRef } from "react";
import { Alert } from "react-bootstrap";
import Swal from "sweetalert2";

const AlertMessage = ({
  type = "bootstrap",
  variant = "success",
  message,
  title = "",
  show = true,
  timer,
  onConfirm,
  onCancel,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const alertRef = useRef(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (type === "sweet" && show) {
      const swalOptions = {
        icon: variant,
        title: title || "",
        text: message,
        timer: timer || null,
        showConfirmButton: !!onConfirm,
        showCancelButton: !!onCancel,
      };

      Swal.fire(swalOptions).then((result) => {
        if (result.isConfirmed && onConfirm) {
          onConfirm();
        } else if (result.isDismissed && onCancel) {
          onCancel();
        } else if (onClose) {
          onClose();
        }
      });
    }
  }, [
    type,
    variant,
    message,
    title,
    show,
    timer,
    onConfirm,
    onCancel,
    onClose,
  ]);

  useEffect(() => {
    if (isVisible && type === "bootstrap") {
      setTimeout(() => {
        setFadeOut(true);
      }, 3000);

      setTimeout(() => {
        setIsVisible(false);
      }, 6000);
    }
  }, [isVisible, type]);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  if (type === "bootstrap") {
    return (
      <Alert
        ref={alertRef}
        variant={variant}
        className={`alert-message${isVisible ? " show" : ""}`}
        style={{
          opacity: isVisible ? (fadeOut ? 0 : 1) : 0,
          transition: "opacity 3s",
        }}
      >
        {message}
      </Alert>
    );
  } else {
    return null;
  }
};

export default AlertMessage;
