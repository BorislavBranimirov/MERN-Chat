import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Logout from './Logout';
import UserContext from '../../utils/userContext';

const NavBar = (props) => {
    const { loggedUser } = useContext(UserContext);
    // whether to extend the full navigation menu on mobile layout
    const [showMobileExtension, setShowMobileExtension] = useState(false);
    const navBarRef = useRef(null);
    const location = useLocation();

    useEffect(() => {
        // hide the extension when navigating to a different url
        if (showMobileExtension) {
            setShowMobileExtension(false);
        }
    }, [location.pathname]);

    useEffect(() => {
        // for mobile layout navigation bar:
        // close mobile navbar if user clicks outside of it
        const handleClickOutside = (event) => {
            if (navBarRef.current && !navBarRef.current.contains(event.target)) {
                setShowMobileExtension(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [navBarRef]);

    const handleShowClick = (event) => {
        setShowMobileExtension((showMobileExtension) => !showMobileExtension);
    };

    return (
        <nav
            className={`navbar ${showMobileExtension && 'navbar-extension-show'}`}
            ref={navBarRef}
        >
            <div>
                <Link to={'/'} className="nav-item nav-brand">
                    Chat App
                </Link>
                <Link to={'/'} className="nav-item nav-item-mobile-hide">Home</Link>
                {loggedUser && (
                    <Link to={'/create-room'} className="nav-item nav-item-mobile-hide">
                        Create room
                    </Link>
                )}
            </div>
            <div>
                {loggedUser ? (
                    <React.Fragment>
                        <span className="nav-item nav-username">{loggedUser}</span>
                        <Link
                            to={'/change-user-pass'}
                            className="nav-item nav-item-mobile-hide"
                        >
                            Change password
                        </Link>
                        <Logout className="nav-item logout-btn" />
                        <button
                            className="nav-item navbar-extension-btn"
                            onClick={handleShowClick}
                            key={showMobileExtension}
                        >
                            <FontAwesomeIcon icon={(showMobileExtension) ? 'chevron-up' : 'chevron-down'} />
                        </button>
                    </React.Fragment>
                ) : (
                        <React.Fragment>
                            <Link to={'/login'} className="nav-item">Login</Link>
                            <Link to={'/signup'} className="nav-item">Sign up</Link>
                        </React.Fragment>
                    )}
            </div>
        </nav>
    );
};

export default NavBar;