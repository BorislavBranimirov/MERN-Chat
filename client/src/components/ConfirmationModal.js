import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const ConfirmationModal = (props) => {
    const modalRef = useRef(null);
    const confirmRef = useRef(null);

    useEffect(() => {
        // close modal if user clicks outside of it
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                props.decline();
            }
        }

        confirmRef.current.focus();

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [modalRef]);

    return createPortal(
        <div className="modal-wrapper">
            <div className="modal" ref={modalRef}>
                <h2>{props.title}</h2>
                <div className="modal-btns">
                    <button ref={confirmRef} className="modal-confirm" onClick={props.accept}>
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