import React, { useEffect } from "react";

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-overlay d-flex justify-content-center align-items-center"
      onClick={onClose}
    >
      <div
        className="modal-content-box bg-white p-4 rounded-3 shadow-lg animate__animated animate__fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
          <h5 className="modal-title mb-0">{title}</h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onClose}
          ></button>
        </div>

        <div className="modal-body mb-3">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
