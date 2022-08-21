import React, { useState, useContext } from 'react';
import ChatRoomListContext from '../../utils/chatRoomListContext';
import NotificationContext from '../../utils/notificationContext';

const CreateRoom = (props) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [noPassword, setNoPassword] = useState(false);
  const setNotifications = useContext(NotificationContext);
  const setChatRoomList = useContext(ChatRoomListContext);

  const handleChange = (event) => {
    switch (event.target.name) {
      case 'name':
        setName(event.target.value);
        break;
      case 'password':
        setPassword(event.target.value);
        break;
      case 'noPassword':
        setNoPassword(event.target.checked);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const res = await fetch('/api/chatrooms', {
        method: 'POST',
        body: JSON.stringify({
          name,
          password: noPassword ? '' : password,
        }),
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
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

      setChatRoomList((chatRooms) => {
        return [
          ...chatRooms,
          {
            id: resJSON.id,
            name: name,
          },
        ];
      });

      setNotifications((notifications) => {
        return [
          ...notifications,
          {
            type: 'standard',
            body: 'Room has been successfully created',
            persistOnPageChange: true,
          },
        ];
      });
      props.history.push('/chatrooms/' + resJSON.id);
    } catch (err) {
      setNotifications((notifications) => {
        return [
          ...notifications,
          { type: 'error', body: 'Error occurred while creating chat room' },
        ];
      });
    }
  };

  return (
    <div className="form-wrapper">
      <h2 className="form-heading">Create a new chat room</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          name="name"
          pattern="[a-zA-Z0-9 ]{6,100}"
          title="Minimum of 6 characters, no special symbols"
          value={name}
          onChange={handleChange}
          required
        />
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          name="password"
          pattern=".{4,72}"
          title="Minimum of 4 characters"
          value={password}
          onChange={handleChange}
          disabled={noPassword}
          required
        />
        <div className="check-box-wrapper">
          <input
            id="noPassword"
            name="noPassword"
            type="checkbox"
            checked={noPassword}
            onChange={handleChange}
          />
          <label htmlFor="noPassword">Do not require password</label>
        </div>
        <input type="submit" value="Create" />
      </form>
    </div>
  );
};

export default CreateRoom;
