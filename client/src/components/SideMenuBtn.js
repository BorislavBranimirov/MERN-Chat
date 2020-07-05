import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const SideMenuBtn = () => {
    const btnRef = useRef(null);

    const handleClick = (event) => {
        // on click remove the hamburger menu button and show the sidebar
        btnRef.current.classList.toggle('hide');
        document.querySelector('.sidebar-wrapper').classList.toggle('sidebar-wrapper-hide');
    };

    return (
        <button
            ref={btnRef}
            className="side-menu-btn"
            onClick={handleClick}
        >
            <FontAwesomeIcon icon="bars" size="2x" />
        </button>
    );
};

export default SideMenuBtn;