import React from 'react';

const NotificationContext = React.createContext({
    notifications: [],
    setNotifications: () => { }
});

export default NotificationContext;