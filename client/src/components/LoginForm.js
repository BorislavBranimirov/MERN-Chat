import React, { useState, useEffect, useContext } from 'react';
import UserContext from '../../utils/userContext';
import NotificationContext from '../../utils/notificationContext';

const LoginForm = (props) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { loggedUser, setLoggedUser, setLoggedUserId } = useContext(UserContext);
    const { setNotifications } = useContext(NotificationContext);

    useEffect(() => {
        // if user doesn't have an access token and was sent to login page
        // but user context isn't updated, update it
        if (loggedUser !== null && !localStorage.getItem('accessToken')) {
            setLoggedUser(null);
            setLoggedUserId(null);
        }
    }, []);

    const handleChange = (event) => {
        switch (event.target.name) {
            case 'username':
                setUsername(event.target.value);
                break;
            case 'password':
                setPassword(event.target.value);
                break;
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const res = await fetch('/api/auth/login', {
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

            // save the access token in local storage
            localStorage.setItem('accessToken', resJSON.accessToken);

            const payload = JSON.parse(window.atob(resJSON.accessToken.split('.')[1]));
            setLoggedUser(payload.username);
            setLoggedUserId(payload.id);

            props.history.push('/');
        } catch (err) {
            setNotifications((notifications) => {
                return [...notifications, { type: 'error', body: 'Error occured while trying to log in' }];
            });
        }
    };

    return (
        <div className="form-wrapper">
            <h2 className="form-heading">Login</h2>
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
                <input type="submit" value="Login" />
            </form>
        </div>
    );
};

export default LoginForm;