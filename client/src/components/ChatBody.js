import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';
import ChatEditInput from './ChatEditInput';
import ConfirmationModal from './ConfirmationModal';
import UserContext from '../../utils/userContext';
import NotificationContext from '../../utils/notificationContext';
import { scrollToBottom, atTopOfScroll } from '../../utils/scrollUtils';

import advancedFormat from 'dayjs/plugin/advancedFormat';
dayjs.extend(advancedFormat);

const ChatBody = React.forwardRef((props, bodyRef) => {
    const [openModal, setOpenModal] = useState(false);
    const [editId, setEditId] = useState('');
    const deleteId = useRef(null);
    const { loggedUser } = useContext(UserContext);
    const { setNotifications } = useContext(NotificationContext);
    const history = useHistory();

    useEffect(() => {
        scrollToBottom(bodyRef.current);
    }, []);

    const handleScroll = async (event) => {
        if (atTopOfScroll(bodyRef.current)) {
            // keep the current scroll position after older messages are loaded
            // otherwise, if scrollTop === 0, it's stays at 0 after new messages are added
            let oldHeight = bodyRef.current.scrollHeight;

            await props.lazyLoad();
            let heightDiff = bodyRef.current.scrollHeight - oldHeight;
            bodyRef.current.scrollTop += heightDiff;
        }
    };

    const handleEditScroll = (bottomOfEdit) => {
        const ref = bodyRef.current;
        // offsetTop - offset from document body
        // scrollTop - position of current scroll
        // offsetHeight - height of element, including padding and borders
        let bottomOfBody = ref.offsetTop + ref.scrollTop + ref.offsetHeight;

        // if edit field is below chat body viewport, scroll by the difference
        if (bottomOfBody < bottomOfEdit) {
            const difference = bottomOfEdit - bottomOfBody;
            ref.scrollTop += difference;
        }
    };

    const handleDelete = async () => {
        const messageId = deleteId.current;

        try {
            const res = await fetch('/api/messages/' + messageId, {
                method: 'DELETE',
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

            deleteId.current = null;
            setOpenModal(false);
        } catch (err) {
            setNotifications((notifications) => {
                return [...notifications, { type: 'error', body: 'Error occurred while deleting message' }];
            });
        }
    };

    const handleDeleteClick = (event) => {
        deleteId.current = event.target.dataset.messageId;
        setOpenModal(true);
    };

    let messageListItems = [];
    for (let i = props.messages.length - 1; i >= 0; i--) {
        messageListItems.push((
            <li key={props.messages[i]._id}>
                <div className="message-header">
                    <div className="message-header-left">
                        <p className="sender">{props.messages[i].sender}</p>
                        <small>{dayjs(props.messages[i].createdAt).format('Do MMM YYYY, HH:mm:ss')}</small>
                    </div>
                    {(loggedUser === props.messages[i].sender &&
                        editId !== props.messages[i]._id) && (
                            <div className="message-header-btn-group">
                                <input
                                    type="button"
                                    value="edit"
                                    onClick={() => setEditId(props.messages[i]._id)}
                                />
                                <input
                                    type="button"
                                    value="delete"
                                    data-message-id={props.messages[i]._id}
                                    onClick={handleDeleteClick}
                                />
                            </div>
                        )}
                </div>
                {editId === props.messages[i]._id ? (
                    <ChatEditInput
                        editId={editId}
                        editInput={props.messages[i].body}
                        hideEditField={() => setEditId('')}
                        handleEditScroll={handleEditScroll}
                    />
                ) : (
                        <p className="message">{props.messages[i].body}</p>
                    )}
            </li>
        ));
    }

    return (
        <div
            ref={bodyRef}
            className="chat-body"
            onScroll={handleScroll}
        >
            {openModal && (
                <ConfirmationModal
                    title={'Are you sure you want to delete this message?'}
                    accept={handleDelete}
                    decline={() => {
                        deleteId.current = null;
                        setOpenModal(false);
                    }}
                />
            )}
            <ul className="message-list">{messageListItems}</ul>
        </div>
    );
});

export default ChatBody;