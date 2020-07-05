import React, { useState, useRef, useEffect } from 'react';
import { socket } from './socketClient';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PrivateRoute from './components/PrivateRoute';
import NavBar from './components/NavBar';
import SideMenuBtn from './components/SideMenuBtn';
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
import { checkTokenExpiry } from '../utils/authUtils';
import '../utils/fetchOverride';
import './style.scss';


const App = () => {
    const [socketConnected, setSocketConnected] = useState(false);
    const [loggedUser, setLoggedUser] = useState(null);
    const [loggedUserId, setLoggedUserId] = useState(null);
    const [userChatRoomList, setUserChatRoomList] = useState([]);
    const [sidebarLoaded, setSidebarLoaded] = useState(false);
    const [notifications, setNotifications] = useState([]);
    // delayed notification is a type of notification that should run after next url change
    const delayedNotification = useRef(null);

    useEffect(() => {
        if (socket.connected) {
            setSocketConnected(true);
        } else {
            socket.on('connect', () => {
                setSocketConnected(true);
            });
        }

        // if user already has an access token on page load, update the app ui with token's info
        const updateAuthUI = async () => {
            const expired = await checkTokenExpiry(localStorage.getItem('accessToken'));
            if (expired) return;

            const token = localStorage.getItem('accessToken');
            const payload = JSON.parse(window.atob(token.split('.')[1]));
            const username = payload.username;
            setLoggedUser(username);
            const id = payload.id;
            setLoggedUserId(id);
        };

        if (localStorage.getItem('accessToken')) {
            updateAuthUI();
        }
    }, []);

    const userContextObj = { loggedUser, setLoggedUser, loggedUserId, setLoggedUserId };
    const chatRoomListContextObj = { userChatRoomList, setUserChatRoomList };
    const notificationContextObj = { notifications, setNotifications, delayedNotification };
    const appClasses = (loggedUser) ? 'app-wrapper app-logged' : 'app-wrapper';

    return (
        socketConnected ? (
            <UserContext.Provider value={userContextObj}>
                <ChatRoomListContext.Provider value={chatRoomListContextObj}>
                    <NotificationContext.Provider value={notificationContextObj}>
                        <BrowserRouter>
                            <div className={appClasses}>
                                <NavBar />
                                {loggedUser && <SideMenuBtn />}
                                {loggedUser && <Sidebar setSidebarLoaded={setSidebarLoaded} />}
                                <NotificationField />
                                <Switch>
                                    <Route
                                        exact path='/'
                                        component={Home}
                                    />

                                    <PrivateRoute
                                        exact path='/signup'
                                        component={SignUpForm}
                                        reverse redirectURL='/'
                                    />

                                    <PrivateRoute
                                        exact path='/login'
                                        component={LoginForm}
                                        reverse redirectURL='/'
                                    />

                                    <PrivateRoute
                                        exact path='/change-user-pass'
                                        component={ChangeUserPass}
                                    />

                                    <PrivateRoute
                                        exact path='/create-room'
                                        component={CreateRoom}
                                    />

                                    <PrivateRoute
                                        exact path='/change-chatroom-pass/:id'
                                        component={ChangeRoomPass}
                                    />

                                    <PrivateRoute
                                        exact path='/chatrooms/:id'
                                        render={(props) =>
                                            (sidebarLoaded || !loggedUser) ? (
                                                <Chat {...props} key={props.match.params.id} />
                                            ) : (
                                                    <div className="center">
                                                        <FontAwesomeIcon
                                                            icon="spinner"
                                                            size="4x"
                                                            pulse
                                                        />
                                                    </div>
                                                )
                                        }
                                    />

                                    <Route
                                        component={NotFound}
                                    />
                                </Switch>
                            </div>
                        </BrowserRouter>
                    </NotificationContext.Provider>
                </ChatRoomListContext.Provider>
            </UserContext.Provider >
        ) : (
                <div className="center">
                    <FontAwesomeIcon icon="spinner" size="4x" pulse />
                </div>
            )
    );
};

export default App;