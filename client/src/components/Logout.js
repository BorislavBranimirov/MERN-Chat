import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import { logout } from '../../utils/authUtils';
import UserContext from '../../utils/userContext';
import ChatRoomListContext from '../../utils/chatRoomListContext';

const Logout = (props) => {
    const [openModal, setOpenModal] = useState(false);
    let history = useHistory();
    const { setLoggedUser, setLoggedUserId } = useContext(UserContext);
    const { setUserChatRoomList } = useContext(ChatRoomListContext);

    const handleClick = (event) => {
        setOpenModal(true);
    };

    const handleAccept = () => {
        setOpenModal(false);
        
        logout();
        setLoggedUser(null);
        setLoggedUserId(null);
        setUserChatRoomList([]);
        return history.push('/');
    };

    return (
        <React.Fragment>
            {openModal && (
                <ConfirmationModal
                    title={'Are you sure you want to log out?'}
                    accept={handleAccept}
                    decline={() => setOpenModal(false)}
                />
            )}
            <button onClick={handleClick} className={props.className}>
                Log out
            </button>
        </React.Fragment>
    );
};

export default Logout;