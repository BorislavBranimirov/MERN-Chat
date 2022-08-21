import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const ConfirmationModal = (props) => {
  const modalRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    // close modal if user clicks outside of it
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        props.decline();
      }
    };

    confirmBtnRef.current.focus();

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [props]);

  return createPortal(
    <div className="modal-wrapper">
      <div className="modal" ref={modalRef}>
        <h2>{props.title}</h2>
        <div className="modal-btns">
          <button
            ref={confirmBtnRef}
            className="modal-confirm"
            onClick={props.accept}
          >
            Yes
          </button>
          <button className="modal-cancel" onClick={props.decline}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal')
  );
};

export default ConfirmationModal;
