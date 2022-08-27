import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
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
  const setChatRoomList = useContext(ChatRoomListContext);
  const setNotifications = useContext(NotificationContext);

  useEffect(() => {
    const deleteMessageListener = (messageId) => {
      setMessages((messages) =>
        messages.filter((message) => message._id !== messageId)
      );
    };
    socket.on('deleteMessage', deleteMessageListener);

    const editMessageListener = (editedMessage) => {
      setMessages((messages) =>
        messages.map((message) => {
          return message._id === editedMessage._id ? editedMessage : message;
        })
      );
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

    return () => {
      socket.off('deleteMessage', deleteMessageListener);
      socket.off('editMessage', editMessageListener);
      socket.off('addMessage', addMessageListener);
    };
  }, []);

  useEffect(() => {
    const openChatRoom = async () => {
      try {
        const resLogin = await fetch(
          `/api/chatrooms/${props.match.params.id}/login`,
          {
            method: 'POST',
            body: JSON.stringify({ socketId: socket.id }),
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
              Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
            },
          }
        );
        // check if token is expired and could not be renewed
        if (resLogin.tokenExpired) {
          return props.history.push('/login');
        }
        // check if password was expected
        let passwordCheckFailed = resLogin.status === 422;

        const resLoginJSON = await resLogin.json();
        if (resLoginJSON.err) {
          // if password is required,
          // set authorised flag to false and show a login page
          if (passwordCheckFailed) {
            setAuthorised(false);
            // only set an id to show that room was found but is not accessible
            setRoomInfo({
              id: props.match.params.id,
              name: '',
              admin: '',
            });
          } else {
            // In case of other errors, send the user a notification
            setNotifications((notifications) => {
              return [
                ...notifications,
                { type: 'error', body: resLoginJSON.err },
              ];
            });
          }

          return setLoaded(true);
        }

        if (resLoginJSON.newRoomAdded) {
          setChatRoomList((chatRooms) => {
            return [
              ...chatRooms,
              {
                id: resLoginJSON.id,
                name: resLoginJSON.name,
              },
            ];
          });
        }

        setAuthorised(true);
        setRoomInfo({
          id: resLoginJSON.id,
          name: resLoginJSON.name,
          admin: resLoginJSON.admin,
        });
      } catch (err) {
        setNotifications((notifications) => {
          return [
            ...notifications,
            {
              type: 'error',
              body: 'Error occurred while trying to join chat room',
            },
          ];
        });
        return setLoaded(true);
      }

      try {
        const limit = 50;
        const resMessages = await fetch(
          `/api/chatrooms/${props.match.params.id}/messages?limit=${limit}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
              Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
            },
          }
        );
        // check if token is expired and could not be renewed
        if (resMessages.tokenExpired) {
          return props.history.push('/login');
        }

        const resMessagesJSON = await resMessages.json();
        if (resMessagesJSON.err) {
          setNotifications((notifications) => {
            return [
              ...notifications,
              { type: 'error', body: resMessagesJSON.err },
            ];
          });

          return setLoaded(true);
        }

        setMessages(resMessagesJSON);
        setLoaded(true);
      } catch (err) {
        setNotifications((notifications) => {
          return [
            ...notifications,
            {
              type: 'error',
              body: 'Error occured while loading chat room messages',
            },
          ];
        });

        return setLoaded(true);
      }
    };

    openChatRoom();

    return () => {
      setRoomInfo({ id: '', name: '', admin: '' });
      setMessages([]);
      setAuthorised(false);
      setLoaded(false);
    };
  }, [props.match.params.id, props.history, setChatRoomList, setNotifications]);

  useEffect(() => {
    return () => {
      socket.emit('leaveChatRoom', props.match.params.id);
    };
  }, [props.match.params.id]);

  const handleDeleteRoom = async () => {
    try {
      const res = await fetch('/api/chatrooms/' + props.match.params.id, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
        },
      });
      // check if token is expired and could not be renewed
      if (res.tokenExpired) {
        return props.history.push('/login');
      }

      const resJSON = await res.json();
      if (resJSON.err) {
        return setNotifications((notifications) => {
          return [...notifications, { type: 'error', body: resJSON.err }];
        });
      }

      setOpenModal(false);

      setChatRoomList((chatRooms) =>
        chatRooms.filter((chatRoom) => props.match.params.id !== chatRoom.id)
      );

      setNotifications((notifications) => {
        return [
          ...notifications,
          {
            type: 'standard',
            body: 'Room has been successfully deleted',
            persistOnPageChange: true,
          },
        ];
      });
      props.history.push('/');
    } catch (err) {
      setNotifications((notifications) => {
        return [
          ...notifications,
          {
            type: 'error',
            body: 'Error occurred while trying to delete chat room',
          },
        ];
      });
    }
  };

  const lazyLoad = async () => {
    if (!lazyLoadLock.current && messages.length > 0) {
      lazyLoadLock.current = true;

      const lastMessage = messages[messages.length - 1];

      let newMessages = [];

      try {
        const limit = 50;
        const resMessages = await fetch(
          `/api/chatrooms/${props.match.params.id}/messages` +
            `?before=${lastMessage._id}&limit=${limit}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
              Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
            },
          }
        );
        // check if token is expired and could not be renewed
        if (resMessages.tokenExpired) {
          lazyLoadLock.current = false;
          return props.history.push('/login');
        }

        const resMessagesJSON = await resMessages.json();
        if (resMessagesJSON.err) {
          lazyLoadLock.current = false;
          return setNotifications((notifications) => {
            return [
              ...notifications,
              { type: 'error', body: resMessagesJSON.err },
            ];
          });
        }

        newMessages = resMessagesJSON;
      } catch (err) {
        setNotifications((notifications) => {
          return [
            ...notifications,
            {
              type: 'error',
              body: 'Error occured while loading chat room messages',
            },
          ];
        });
      }

      lazyLoadLock.current = false;

      // if no new messages were found, don't update the state
      if (newMessages.length === 0) return;

      setMessages((messages) => [...messages, ...newMessages]);
    }
  };

  return loaded ? (
    roomInfo.id === '' ? (
      <div className="center">
        <h1>Room does not exist or was deleted</h1>
      </div>
    ) : authorised ? (
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
            <p className="room-admin">
              Admin: <span>{roomInfo.admin}</span>
            </p>
            {roomInfo.admin === loggedUser && (
              <div className="room-info-right">
                <Link to={'/change-chatroom-pass/' + props.match.params.id}>
                  Change room password
                </Link>
                <input
                  className="delete-room-btn"
                  type="button"
                  value="Delete chat room"
                  onClick={() => {
                    setOpenModal(true);
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <ChatBody ref={chatBodyRef} messages={messages} lazyLoad={lazyLoad} />
        <div className="chat-footer">
          <TypingIndicator />
          <ChatInput
            chatRoomId={props.match.params.id}
            chatBodyRef={chatBodyRef}
          />
        </div>
      </div>
    ) : (
      <RoomLoginForm
        id={props.match.params.id}
        setAuthorised={setAuthorised}
        setRoomInfo={setRoomInfo}
        setMessages={setMessages}
      />
    )
  ) : (
    <div className="center">
      <FontAwesomeIcon icon={faSpinner} size="4x" pulse />
    </div>
  );
};

export default Chat;
