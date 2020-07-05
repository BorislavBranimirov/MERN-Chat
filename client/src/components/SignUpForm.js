import React, { useState, useContext } from 'react';
import NotificationContext from '../../utils/notificationContext';

const SignUpForm = (props) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { setNotifications, delayedNotification } = useContext(NotificationContext);

    const handleChange = (event) => {
        switch (event.target.name) {
            case 'username':
                setUsername(event.target.value);
                break;
            case 'password':
                setPassword(event.target.value);
                break;
            case 'confirmPassword':
                setConfirmPassword(event.target.value);
                break;
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            if (password !== confirmPassword) {
                return setNotifications((notifications) => {
                    return [...notifications, { type: 'error', body: 'Passwords must be the same' }];
                });
            }

            const res = await fetch('/api/users', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    password
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8'
                }
            });

            const resJSON = await res.json();
            // check if an error was returned
            if (resJSON.err) {
                return setNotifications((notifications) => {
                    return [...notifications, { type: 'error', body: resJSON.err }];
                });
            }

            delayedNotification.current = {
                type: 'standard', body: 'You have successfully signed up, now log in to your account'
            };
            props.history.push('/login');
        } catch (err) {
            return setNotifications((notifications) => {
                return [...notifications, { type: 'error', body: 'Error occurred while trying to sign up' }];
            });
        }
    };

    return (
        <div className="form-wrapper">
            <h2 className="form-heading">Sign up</h2>
            <form onSubmit={handleSubmit}>
                <label htmlFor="username">Username:</label>
                <input
                    id="username"
                    type="text"
                    name="username"
                    pattern="[a-zA-Z0-9]{6,25}"
                    title="Minimum of 6 characters, no spaces or special symbols"
                    value={username}
                    onChange={handleChange}
                    required
                />
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
                <input type="submit" value="Sign up" />
            </form>
        </div>
    );
};

export default SignUpForm;