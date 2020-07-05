import React from 'react';

const UserContext = React.createContext({
    loggedUser: null,
    setLoggedUser: ()=>{}
});

export default UserContext;