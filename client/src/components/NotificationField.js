import React, { useEffect, useRef, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NotificationContext from '../../utils/notificationContext';

const NotificationField = (props) => {
    const { notifications, setNotifications, delayedNotification } = useContext(NotificationContext);
    const location = useLocation();
    const timer = useRef(null);

    // clear notifications when changing url
    useEffect(() => {
        // if a delayed notification is set, clear the rest and show it
        if (delayedNotification.current) {
            setNotifications([delayedNotification.current]);
            delayedNotification.current = null;
        } else {
            setNotifications([]);
        }
    }, [location.pathname]);

    useEffect(() => {
        if (notifications.length > 0) {
            if (timer.current)
                clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                setNotifications((notifications) => notifications.slice(0, -1))
            }, 5000);
        }
    }, [notifications]);

    const handleClick = (event) => {
        setNotifications((notifications) => notifications.slice(0, -1));
    };

    if (notifications.length === 0) {
        return null;
    }

    let currentNotification = notifications[notifications.length - 1];
    return (
        <div className={`notification ${(currentNotification.type === 'error') ? 'error-color' : 'default-color'}`}>
            <span className="notification-body">{currentNotification.body}</span>
            <div className="notification-controllers">
                {(notifications.length > 1) && (
                    <span className="notification-count">{notifications.length} messages</span>
                )}
                <button
                    className="close-notification-btn"
                    type="button"
                    onClick={handleClick}
                >
                    <FontAwesomeIcon icon="times" size="2x" />
                </button>
            </div>
        </div>
    );
};

export default NotificationField;