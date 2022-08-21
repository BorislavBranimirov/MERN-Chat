import React, { useState, useContext } from 'react';
import UserContext from '../../utils/userContext';
import NotificationContext from '../../utils/notificationContext';

const ChangeUserPass = (props) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { loggedUser } = useContext(UserContext);
  const setNotifications = useContext(NotificationContext);

  const handleChange = (event) => {
    switch (event.target.name) {
      case 'password':
        setPassword(event.target.value);
        break;
      case 'confirmPassword':
        setConfirmPassword(event.target.value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (password !== confirmPassword) {
        return setNotifications((notifications) => {
          return [
            ...notifications,
            { type: 'error', body: 'Passwords must be the same' },
          ];
        });
      }

      const res = await fetch('/api/users/' + loggedUser, {
        method: 'PATCH',
        body: JSON.stringify({
          password,
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

      setNotifications((notifications) => {
        return [
          ...notifications,
          {
            type: 'standard',
            body: 'You have successfully updated your password',
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
            body: 'Error occurred while changing user password',
          },
        ];
      });
    }
  };

  return (
    <div className="form-wrapper">
      <h2 className="form-heading">Change account's password</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          name="password"
          pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,72}"
          title="Minimum of 8 characters, one lowercase letter, one uppercase letter and a digit"
          value={password}
          onChange={handleChange}
          required
        />
        <label htmlFor="confirmPassword">Confirm password:</label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,72}"
          title="Minimum of 8 characters, one lowercase letter, one uppercase letter and a digit"
          value={confirmPassword}
          onChange={handleChange}
          required
        />
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
};

export default ChangeUserPass;
