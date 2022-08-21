import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import { logout } from '../../utils/authUtils';
import UserContext from '../../utils/userContext';

const Logout = (props) => {
  const [openModal, setOpenModal] = useState(false);
  let history = useHistory();
  const { setLoggedUser } = useContext(UserContext);

  const handleAccept = async () => {
    setOpenModal(false);

    await logout();
    setLoggedUser(null);
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
      <button onClick={() => setOpenModal(true)} className={props.className}>
        Log out
      </button>
    </React.Fragment>
  );
};

export default Logout;
