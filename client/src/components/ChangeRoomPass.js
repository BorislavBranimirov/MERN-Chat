import React, { useState, useContext } from 'react';
import NotificationContext from '../../utils/notificationContext';

const ChangeRoomPass = (props) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [noPassword, setNoPassword] = useState(false);
    const { setNotifications, delayedNotification } = useContext(NotificationContext);

    const handleChange = (event) => {
        switch (event.target.name) {
            case 'password':
                setPassword(event.target.value);
                break;
            case 'confirmPassword':
                setConfirmPassword(event.target.value);
                break;
            case 'noPassword':
                setNoPassword(event.target.checked);
                break;
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            if (!noPassword && (password !== confirmPassword)) {
                return setNotifications((notifications) => {
                    return [...notifications, { type: 'error', body: 'Passwords must be the same' }];
                });
            }

            const res = await fetch('/api/chatrooms/' + props.match.params.id, {
                method: 'PATCH',
                body: JSON.stringify({
                    password: (noPassword) ? ('') : (password)
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
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

            delayedNotification.current = {
                type: 'standard', body: 'You have successfully updated the room\'s password'
            };
            props.history.push('/chatrooms/' + resJSON.id);
        } catch (err) {
            setNotifications((notifications) => {
                return [...notifications, { type: 'error', body: 'Error occurred while changing chat room password' }];
            });
        }
    };

    return (
        <div className="form-wrapper">
            <h2 className="form-heading">Change chat room's password</h2>
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
                    disabled={noPassword}
                    required
                />
                <label htmlFor="confirmPassword">Confirm password:</label>
                <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    pattern=".{4,72}"
                    title="Minimum of 4 characters"
                    value={confirmPassword}
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
                    <label htmlFor="noPassword">Remove password</label>
                </div>
                <input type="submit" value="Submit" />
            </form>
        </div>
    );
};

export default ChangeRoomPass;