import React, { useState, useLayoutEffect } from 'react';
import { socket } from './socketClient';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import jwt_decode from 'jwt-decode';
import PrivateRoute from './components/PrivateRoute';
import NavBar from './components/NavBar';
import Sidebar from './components/Sidebar';
import NotificationField from './components/NotificationField';
import Home from './components/Home';
import SignUpForm from './components/SignUpForm';
import LoginForm from './components/LoginForm';
import ChangeUserPass from './components/ChangeUserPass';
import CreateRoom from './components/CreateRoom';
import ChangeRoomPass from './components/ChangeRoomPass';
import Chat from './components/Chat';
import NotFound from './components/NotFound';

import UserContext from '../utils/userContext';
import ChatRoomListContext from '../utils/chatRoomListContext';
import NotificationContext from '../utils/notificationContext';
import { checkTokenExpired } from '../utils/authUtils';
import '../utils/fetchOverride';
import './style.scss';

const App = () => {
  const [socketConnected, setSocketConnected] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const [chatRoomList, setChatRoomList] = useState([]);
  const [sidebarLoaded, setSidebarLoaded] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useLayoutEffect(() => {
    const connectListener = () => {
      setSocketConnected(true);
    };
    socket.on('connect', connectListener);

    const connectErrorListener = () => {
      setNotifications((notifications) => {
        return [
          ...notifications,
          {
            type: 'error',
            body: 'Failed to authenticate',
            persistOnPageChange: true,
          },
        ];
      });
    };
    socket.on('connect_error', connectErrorListener);

    // if user already has an access token on page load, update the app ui with token's info
    const updateAuthUI = async () => {
      const expired = await checkTokenExpired(
        localStorage.getItem('accessToken')
      );
      if (expired) return;

      const token = localStorage.getItem('accessToken');
      const payload = jwt_decode(token);
      const username = payload.username;
      setLoggedUser(username);
      socket.auth.token = token;
      socket.connect();
    };

    if (localStorage.getItem('accessToken')) {
      updateAuthUI();
    }

    return () => {
      socket.off('connect', connectListener);
      socket.off('connect_error', connectErrorListener);
    };
  }, []);

  const userContextObj = { loggedUser, setLoggedUser };

  return (
    <UserContext.Provider value={userContextObj}>
      <ChatRoomListContext.Provider value={setChatRoomList}>
        <NotificationContext.Provider value={setNotifications}>
          <BrowserRouter>
            <div
              className={loggedUser ? 'app-wrapper app-logged' : 'app-wrapper'}
            >
              <NavBar />
              {loggedUser && (
                <Sidebar
                  chatRoomList={chatRoomList}
                  setSidebarLoaded={setSidebarLoaded}
                />
              )}
              <NotificationField notifications={notifications} />
              <Switch>
                <Route exact path="/" component={Home} />

                <PrivateRoute
                  exact
                  path="/signup"
                  component={SignUpForm}
                  reverse
                  redirectURL="/"
                />

                <PrivateRoute
                  exact
                  path="/login"
                  component={LoginForm}
                  reverse
                  redirectURL="/"
                />

                <PrivateRoute
                  exact
                  path="/change-user-pass"
                  component={ChangeUserPass}
                />

                <PrivateRoute
                  exact
                  path="/create-room"
                  component={CreateRoom}
                />

                <PrivateRoute
                  exact
                  path="/change-chatroom-pass/:id"
                  component={ChangeRoomPass}
                />

                <PrivateRoute
                  exact
                  path="/chatrooms/:id"
                  render={(props) =>
                    sidebarLoaded && socketConnected ? (
                      <Chat {...props} />
                    ) : (
                      <div className="center">
                        <FontAwesomeIcon icon={faSpinner} size="4x" pulse />
                      </div>
                    )
                  }
                />

                <Route component={NotFound} />
              </Switch>
            </div>
          </BrowserRouter>
        </NotificationContext.Provider>
      </ChatRoomListContext.Provider>
    </UserContext.Provider>
  );
};

export default App;
