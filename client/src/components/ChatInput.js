import React, { useState, useEffect, useLayoutEffect, useRef, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { socket } from '../socketClient';
import NotificationContext from '../../utils/notificationContext';

const ChatInput = (props) => {
    const [input, setInput] = useState('');
    const inputFieldRef = useRef(null);
    const { setNotifications } = useContext(NotificationContext);
    const history = useHistory();

    useEffect(() => {
        inputFieldRef.current.focus();
    }, []);

    useLayoutEffect(() => {
        // lowest point of chat body viewport
        const bodyScrollBottom = props.chatBodyRef.current.scrollTop + props.chatBodyRef.current.clientHeight;

        const totalBorderHeight = inputFieldRef.current.offsetHeight - inputFieldRef.current.clientHeight;
        inputFieldRef.current.style.height = '0';
        inputFieldRef.current.style.height = inputFieldRef.current.scrollHeight + totalBorderHeight + 'px';

        // preserve old lowest point
        props.chatBodyRef.current.scrollTop = bodyScrollBottom - props.chatBodyRef.current.clientHeight;
    }, [input]);

    const handleChange = (event) => {
        socket.emit('userTyping', props.chatRoomId);
        setInput(event.target.value);
    };

    const handleKeyDown = (event) => {
        // if enter is pressed without shift, send the message
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        // don't submit empty messages
        if (input.trim().length === 0)
            return;

        try {
            const res = await fetch('/api/chatrooms/' + props.chatRoomId + '/messages', {
                method: 'POST',
                body: JSON.stringify({
                    body: input
                }),
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                }
            });
            // check if token is expired expired and could not be renewed
            if (res.tokenExpired) {
                return history.push('/login');
            }

            const resJSON = await res.json();
            // check if an error was returned
            if (resJSON.err) {
                return setNotifications((notifications) => {
                    return [...notifications, { type: 'error', body: resJSON.err }];
                });
            }

            setInput('');
        } catch (err) {
            setNotifications((notifications) => {
                return [...notifications, { type: 'error', body: 'Error occurred while submitting new message' }];
            });
        }
    };

    return (
        <div className="chat-input">
            <form onSubmit={handleSubmit}>
                <textarea
                    className="chat-input-field"
                    name="input"
                    ref={inputFieldRef}
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="chat-input-btn"
                    type="submit"
                >
                    <FontAwesomeIcon icon="paper-plane" />
                </button>
            </form>
        </div>
    );
};

export default ChatInput;