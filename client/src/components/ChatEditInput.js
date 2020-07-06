import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import NotificationContext from '../../utils/notificationContext';
import { scrollToBottom } from '../../utils/scrollUtils';

const ChatEditInput = (props) => {
    const [editInput, setEditInput] = useState('');
    const editInputFieldRef = useRef(null);
    const initialScroll = useRef(false);
    const { setNotifications } = useContext(NotificationContext);
    const history = useHistory();

    useEffect(() => {
        setEditInput(props.editInput);
        editInputFieldRef.current.focus();
    }, []);

    useEffect(() => {
        // resize text area to fit content
        const totalBorderHeight = editInputFieldRef.current.offsetHeight - editInputFieldRef.current.clientHeight;
        editInputFieldRef.current.style.height = '0';
        editInputFieldRef.current.style.height = editInputFieldRef.current.scrollHeight + totalBorderHeight + 'px';

        // do an initial scroll to bottom after first loading and resizing the edit field
        // used because chromium browsers don't do it automatically
        // this only matters if a max-height was set to the edit field and the edit message exceeds it,
        // otherwise there is nothing to scroll to
        if (!initialScroll.current && editInput !== '') {
            scrollToBottom(editInputFieldRef.current);
            initialScroll.current = true;
        }

        // check if chat body needs to scroll to bring edit field into view
        const bottomOfEdit = editInputFieldRef.current.closest('li').offsetTop
            + editInputFieldRef.current.closest('li').offsetHeight;
        props.handleEditScroll(bottomOfEdit);
    }, [editInput]);

    const handleEditChange = (event) => {
        setEditInput(event.target.value);
    };

    const handleKeyDown = (event) => {
        // if enter is pressed without shift, send the message
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            return handleSave(event);
        }

        // if escape is pressed, hide edit field
        if (event.key === 'Escape' || event.key === 'Esc') {
            event.preventDefault();
            return props.hideEditField();
        }
    }

    const handleSave = async (event) => {
        // don't submit if message is empty or the same as the original
        if (editInput.trim().length === 0 || editInput.trim() === props.editInput)
            return props.hideEditField();

        try {
            const res = await fetch('/api/messages/' + props.editId, {
                method: 'PATCH',
                body: JSON.stringify({
                    body: editInput
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

            props.hideEditField();
        } catch (err) {
            setNotifications((notifications) => {
                return [...notifications, { type: 'error', body: 'Error occurred while saving edited message' }];
            });
        }
    };

    return (
        <div>
            <textarea
                className="chat-edit-input-field"
                name="input"
                ref={editInputFieldRef}
                value={editInput}
                onChange={handleEditChange}
                onKeyDown={handleKeyDown}
            />
            <div className="chat-edit-input-btn-group">
                <input
                    type="button"
                    value="save"
                    onClick={handleSave}
                />
                <input
                    type="button"
                    value="cancel"
                    onClick={props.hideEditField}
                />
            </div>
        </div>
    );
};

export default ChatEditInput;