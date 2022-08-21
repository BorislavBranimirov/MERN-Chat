import React, { useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import NotificationContext from '../../utils/notificationContext';

const NotificationField = (props) => {
  const notifications = props.notifications;
  const setNotifications = useContext(NotificationContext);
  const location = useLocation();

  // clear notifications when changing url, unless specified otherwise
  useEffect(() => {
    setNotifications((notifications) => {
      const newArr = [];
      notifications.forEach((notification) => {
        if (notification.persistOnPageChange) {
          // reset the persistOnPageChange flag after first page change
          newArr.push({ ...notification, persistOnPageChange: false });
        }
      });
      return newArr;
    });
  }, [location.pathname, setNotifications]);

  useEffect(() => {
    if (notifications.length > 0) {
      const timeout = setTimeout(() => {
        setNotifications((notifications) => notifications.slice(0, -1));
      }, 5000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [notifications, setNotifications]);

  const handleClick = () => {
    setNotifications((notifications) => notifications.slice(0, -1));
  };

  if (notifications.length === 0) {
    return null;
  }

  let currentNotification = notifications[notifications.length - 1];
  return (
    <div
      className={`notification ${
        currentNotification.type === 'error' ? 'error-color' : 'default-color'
      }`}
    >
      <span className="notification-body">{currentNotification.body}</span>
      <div className="notification-controllers">
        {notifications.length > 1 && (
          <span className="notification-count">
            {notifications.length} messages
          </span>
        )}
        <button
          className="close-notification-btn"
          type="button"
          onClick={handleClick}
        >
          <FontAwesomeIcon icon={faTimes} size="2x" />
        </button>
      </div>
    </div>
  );
};

export default NotificationField;
