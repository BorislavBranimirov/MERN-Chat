import React, { useState } from 'react';

const RoomLoginForm = (props) => {
    const [password, setPassword] = useState('');

    const handleChange = (event) => {
        setPassword(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        props.login(password);
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