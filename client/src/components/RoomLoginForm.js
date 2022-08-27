import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { socket } from '../socketClient';
import ChatRoomListContext from '../../utils/chatRoomListContext';
import NotificationContext from '../../utils/notificationContext';

const RoomLoginForm = (props) => {
  const [password, setPassword] = useState('');
  const setChatRoomList = useContext(ChatRoomListContext);
  const setNotifications = useContext(NotificationContext);
  const history = useHistory();

  const handleChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const login = async () => {
      try {
        const resLogin = await fetch(`/api/chatrooms/${props.id}/login`, {
          method: 'POST',
          body: JSON.stringify({ socketId: socket.id, password }),
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
          },
        });
        // check if token is expired and could not be renewed
        if (resLogin.tokenExpired) {
          return history.push('/login');
        }

        const resLoginJSON = await resLogin.json();
        if (resLoginJSON.err) {
          return setNotifications((notifications) => {
            return [
              ...notifications,
              { type: 'error', body: resLoginJSON.err },
            ];
          });
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

        // on successful room entry with password, remove all notifications
        // clears any 'wrong password' notifications that the user might have
        setNotifications([]);

        props.setAuthorised(true);
        props.setRoomInfo({
          id: resLoginJSON.id,
          name: resLoginJSON.name,
          admin: resLoginJSON.admin,
        });
      } catch (err) {
        return setNotifications((notifications) => {
          return [
            ...notifications,
            {
              type: 'error',
              body: 'Error occurred while trying to join chat room',
            },
          ];
        });
      }

      try {
        const limit = 50;
        const resMessages = await fetch(
          `/api/chatrooms/${props.id}/messages?limit=${limit}`,
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
          return history.push('/login');
        }

        const resMessagesJSON = await resMessages.json();
        if (resMessagesJSON.err) {
          return setNotifications((notifications) => {
            return [
              ...notifications,
              { type: 'error', body: resMessagesJSON.err },
            ];
          });
        }

        props.setMessages(resMessagesJSON);
      } catch (err) {
        return setNotifications((notifications) => {
          return [
            ...notifications,
            {
              type: 'error',
              body: 'Error occured while loading chat room messages',
            },
          ];
        });
      }
    };

    login(password);
  };

  return (
    <div className="form-wrapper">
      <h2 className="form-heading">Log in to room</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          name="password"
          pattern=".{4,72}"
          title="Minimum of 4 characters"
          value={password}
          onChange={handleChange}
          required
        />
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
};

export default RoomLoginForm;
