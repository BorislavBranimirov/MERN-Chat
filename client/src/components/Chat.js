import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { socket } from '../socketClient';
import ChatBody from './ChatBody';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import RoomLoginForm from './RoomLoginForm';
import ConfirmationModal from './ConfirmationModal';
import UserContext from '../../utils/userContext';
import ChatRoomListContext from '../../utils/chatRoomListContext';
import NotificationContext from '../../utils/notificationContext';
import { atBottomOfScroll, scrollToBottom } from '../../utils/scrollUtils';

const Chat = (props) => {
    const [roomInfo, setRoomInfo] = useState({ id: '', name: '', admin: '' });
    const [messages, setMessages] = useState([]);
    const [authorised, setAuthorised] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    // lock on lazy load to prevent more requests from being sent if one is currently being handled
    const lazyLoadLock = useRef(false);
    const chatBodyRef = useRef(null);
    const { loggedUser } = useContext(UserContext);
    const { setUserChatRoomList } = useContext(ChatRoomListContext);
    const { notifications, setNotifications, delayedNotification } = useContext(NotificationContext);

    useEffect(() => {
        const deleteMessageListener = (messageId) => {
            setMessages((messages) => messages.filter((message) => message._id !== messageId));
        };
        socket.on('deleteMessage', deleteMessageListener);

        const editMessageListener = (editedMessage) => {
            setMessages((messages) => messages.map((message) => {
                return (message._id === editedMessage._id) ? editedMessage : message;
            }));
        };
        socket.on('editMessage', editMessageListener);

        const addMessageListener = (message) => {
            const atBottom = atBottomOfScroll(chatBodyRef.current);

            setMessages((messages) => [message, ...messages]);

            // if at bottom of scroll, scroll again to account for the new message
            if (atBottom) {
                scrollToBottom(chatBodyRef.current);
            }
        };
        socket.on('addMessage', addMessageListener);

        login();

        return (() => {
            socket.removeListener('deleteMessage', deleteMessageListener);
            socket.removeListener('editMessage', editMessageListener);
            socket.removeListener('addMessage', addMessageListener);
            socket.emit('leaveChatRoom', props.match.params.id);
        });
    }, []);

    /**
     * Log in to chat room and on success load messages
     * @param {string} password - optional parameter for logging in to a room that requires a password
     */
    const login = async (password) => {
        try {
            let body = { socketId: socket.id };
            if (password)
                body.password = password;

            const resLogin = await fetch('/api/chatrooms/' + props.match.params.id + '/login', {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                }
            });
            // check if token is expired expired and could not be renewed
            if (resLogin.tokenExpired) {
                return props.history.push('/login');
            }
            // check if password is wrong or missing
            let passwordCheckFailed = (resLogin.status === 422) ? true : false;

            const resLoginJSON = await resLogin.json();
            // check if an error was returned
            if (resLoginJSON.err) {
                // on first enter into the room with no password provided,
                // authorised flag should be set to false and the user should be shown a login page
                if (passwordCheckFailed && !password) {
                    setAuthorised(false);
                    // only set an id to show that room was found but is not accessible
                    setRoomInfo({
                        id: props.match.params.id,
                        name: '',
                        admin: ''
                    });
                } else {
                    // In case of other errors or password check error where a wrong password was provided,
                    // send the user a notification
                    setNotifications((notifications) => {
                        return [...notifications, { type: 'error', body: resLoginJSON.err }];
                    });
                }

                return setLoaded(true);
            }

            if (resLoginJSON.newRoomAdded) {
                setUserChatRoomList((chatRooms) => {
                    return ([...chatRooms, {
                        id: resLoginJSON.id,
                        name: resLoginJSON.name
                    }]);
                });
            }

            // on successful room entry with password, remove all notifications
            // this is used to clear any wrong password notifications that the user might have
            if (password && notifications.length > 0) {
                setNotifications([]);
            }

            socket.emit('setUserTypingUsername', localStorage.getItem('accessToken'));
            setAuthorised(true);
            setRoomInfo({
                id: resLoginJSON.id,
                name: resLoginJSON.name,
                admin: resLoginJSON.admin
            });
        } catch (err) {
            setNotifications((notifications) => {
                return [...notifications, { type: 'error', body: 'Error occurred while trying to join chat room' }];
            });
            return setLoaded(true);
        }

        const messages = await fetchMessages();
        setMessages(messages);
        setLoaded(true);
    };

    const fetchMessages = async (beforeId = null, limit = 50) => {
        let query = '?';
        if (beforeId) query += `before=${beforeId}&`;
        query += `limit=${limit}`;

        try {
            const resMessages = await fetch(`/api/chatrooms/${props.match.params.id}/messages${query}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                }
            });
            // check if token is expired expired and could not be renewed
            if (resMessages.tokenExpired) {
                props.history.push('/login');
                return [];
            }

            const resMessagesJSON = await resMessages.json();
            // check if an error was returned
            if (resMessagesJSON.err) {
                setNotifications((notifications) => {
                    return [...notifications, { type: 'error', body: resMessagesJSON.err }];
                });
                return [];
            }

            return resMessagesJSON;
        } catch (err) {
            setNotifications((notifications) => {
                return [...notifications, { type: 'error', body: 'Error occured while loading chat room messages' }];
            });
            return [];
        }
    };

    const lazyLoad = async () => {
        if (!lazyLoadLock.current) {
            lazyLoadLock.current = true;

            const lastMessage = messages[messages.length - 1];

            const newMessages = await fetchMessages(lastMessage._id);

            lazyLoadLock.current = false;

            // if no new rooms were found, don't update the state
            if (newMessages.length === 0)
                return;

            setMessages((messages) => [...messages, ...newMessages]);
        }
    };

    const handleDeleteRoom = async () => {
        try {
            const res = await fetch('/api/chatrooms/' + props.match.params.id, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                }
            });
            // check if token is expired expired and could not be renewed
            if (res.tokenExpired) {
                return props.history.push('/login');
            }

            const resJSON = await res.json();
            // check if an error was returned
            if (resJSON.err) {
                return setNotifications((notifications) => {
                    return [...notifications, { type: 'error', body: resJSON.err }];
                });
            }

            setOpenModal(false);

            setUserChatRoomList((chatRooms) => chatRooms.filter((chatRoom) => props.match.params.id !== chatRoom.id));

            delayedNotification.current = { type: 'standard', body: 'Room has been successfully deleted' };
            props.history.push('/');
        } catch (err) {
            setNotifications((notifications) => {
                return [...notifications, { type: 'error', body: 'Error occurred while trying to delete chat room' }];
            });
        }
    };

    const handleDeleteClick = (event) => {
        setOpenModal(true);
    };

    return (
        loaded ? (
            (roomInfo.id === '' ? (
                <div className="center">
                    <h1>Room does not exist or was deleted</h1>
                </div>
            ) : (
                    (authorised ? (
                        <div className="chat">
                            {openModal && (
                                <ConfirmationModal
                                    title={'Are you sure you want to delete this chat room?'}
                                    accept={handleDeleteRoom}
                                    decline={() => setOpenModal(false)}
                                />
                            )}
                            <div className="chat-header">
                                <h2 className="room-name">{roomInfo.name}</h2>
                                <div className="room-info">
                                    <p className="room-admin">Admin: <span>{roomInfo.admin}</span></p>
                                    {(roomInfo.admin === loggedUser) && (
                                        <div className="room-info-right">
                                            <Link to={'/change-chatroom-pass/' + props.match.params.id}>
                                                Change room password
                                            </Link>
                                            <input
                                                className="delete-room-btn"
                                                type="button"
                                                value="Delete chat room"
                                                onClick={handleDeleteClick}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <ChatBody
                                ref={chatBodyRef}
                                messages={messages}
                                lazyLoad={lazyLoad}
                            />
                            <div className="chat-footer">
                                <TypingIndicator />
                                <ChatInput
                                    chatRoomId={props.match.params.id}
                                    chatBodyRef={chatBodyRef}
                                />
                            </div>
                        </div>
                    ) : (
                            <RoomLoginForm login={login} />
                        ))
                ))
        ) : (
                <div className="center">
                    <FontAwesomeIcon icon="spinner" size="4x" pulse />
                </div>
            )
    );
}

export default Chat;