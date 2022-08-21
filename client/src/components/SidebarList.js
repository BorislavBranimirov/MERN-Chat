import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faTimes } from '@fortawesome/free-solid-svg-icons';
import { atBottomOfScroll } from '../../utils/scrollUtils';

const SidebarList = (props) => {
  const {
    roomListRef,
    filtered,
    filteredChatRooms,
    chatRoomList,
    handleLeaveClick,
    fetchFilteredRooms,
    setSidebarFilter,
  } = props;
  // lock on lazy load to prevent more requests from being sent
  // when one is currently being handled
  const lazyLoadLock = useRef(false);

  const lazyLoad = async () => {
    if (!lazyLoadLock.current && filteredChatRooms.length > 0) {
      lazyLoadLock.current = true;

      const lastChatRoom = filteredChatRooms[filteredChatRooms.length - 1];

      const newChatRooms = await fetchFilteredRooms(null, lastChatRoom.name);

      lazyLoadLock.current = false;

      // if no new rooms were found, don't update the state
      if (newChatRooms.length === 0) return;

      setSidebarFilter((sidebarFilter) => {
        return {
          ...sidebarFilter,
          filteredChatRooms: [
            ...sidebarFilter.filteredChatRooms,
            ...newChatRooms,
          ],
        };
      });
    }
  };

  let chatRoomLinks = [];
  if (filtered) {
    chatRoomLinks = filteredChatRooms.map((chatRoom) => {
      return (
        <li key={chatRoom._id}>
          <NavLink
            exact
            to={'/chatrooms/' + chatRoom._id}
            activeClassName="active-room"
          >
            {chatRoom.name}
            {chatRoom.hasPassword ? (
              <FontAwesomeIcon
                icon={faLock}
                className="room-list-lock-icon"
                size="lg"
              />
            ) : (
              ''
            )}
          </NavLink>
        </li>
      );
    });
  } else {
    chatRoomLinks = chatRoomList.map((chatRoom) => {
      return (
        <li key={chatRoom.id}>
          <NavLink
            exact
            to={'/chatrooms/' + chatRoom.id}
            activeClassName="active-room"
          >
            {chatRoom.name}
          </NavLink>
          <button
            className="leave-room-btn"
            type="button"
            data-room-id={chatRoom.id}
            onClick={handleLeaveClick}
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </li>
      );
    });
  }

  return (
    <React.Fragment>
      {filtered && <p className="found-rooms-message">Found rooms:</p>}
      <ul
        ref={roomListRef}
        className="room-list"
        onScroll={() => {
          if (filtered && atBottomOfScroll(roomListRef.current)) {
            lazyLoad();
          }
        }}
      >
        {chatRoomLinks}
      </ul>
    </React.Fragment>
  );
};

export default SidebarList;
