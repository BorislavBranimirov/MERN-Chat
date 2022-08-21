import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useLayoutEffect,
} from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import SearchBar from './SearchBar';
import ConfirmationModal from './ConfirmationModal';
import UserContext from '../../utils/userContext';
import ChatRoomListContext from '../../utils/chatRoomListContext';
import NotificationContext from '../../utils/notificationContext';
import { scrollToTop } from '../../utils/scrollUtils';
import SidebarList from './SidebarList';

const Sidebar = (props) => {
  const [openSideBar, setOpenSideBar] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState({
    filtered: false,
    nameFilter: '',
    filteredChatRooms: [],
  });
  const leaveId = useRef(null);
  const roomListRef = useRef(null);
  const sidebarRef = useRef(null);
  const { loggedUser } = useContext(UserContext);
  const setChatRoomList = useContext(ChatRoomListContext);
  const setNotifications = useContext(NotificationContext);
  const location = useLocation();
  const history = useHistory();
  const setSidebarLoaded = props.setSidebarLoaded;

  useLayoutEffect(() => {
    // reset scroll when filter changes
    scrollToTop(roomListRef.current);
  }, [sidebarFilter.filtered, sidebarFilter.nameFilter]);

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const res = await fetch('/api/users/' + loggedUser + '/chatrooms', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
          },
        });
        // check if token is expired and could not be renewed
        if (res.tokenExpired) {
          return history.push('/login');
        }

        const resJSON = await res.json();
        if (resJSON.err) {
          return setNotifications((notifications) => {
            return [...notifications, { type: 'error', body: resJSON.err }];
          });
        }

        setChatRoomList(
          resJSON.map((chatRoom) => {
            return {
              id: chatRoom._id,
              name: chatRoom.name,
            };
          })
        );

        setSidebarLoaded(true);
      } catch (err) {
        setNotifications((notifications) => {
          return [
            ...notifications,
            {
              type: 'error',
              body: 'Error occurred while loading sidebar chat room list',
            },
          ];
        });
      }
    };

    if (loggedUser) {
      fetchChatRooms();
    }

    return () => {
      setChatRoomList([]);
    };
  }, [
    loggedUser,
    setSidebarLoaded,
    history,
    setChatRoomList,
    setNotifications,
  ]);

  useEffect(() => {
    // hide mobile sidebar when navigating to a different url
    setOpenSideBar(false);
  }, [location.pathname]);

  useEffect(() => {
    // close mobile sidebar if user clicks outside of it
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setOpenSideBar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLeave = async () => {
    const roomId = leaveId.current;

    try {
      const res = await fetch('/api/chatrooms/' + roomId + '/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
        },
      });
      // check if token is expired and could not be renewed
      if (res.tokenExpired) {
        return history.push('/login');
      }

      const resJSON = await res.json();
      if (resJSON.err) {
        return setNotifications((notifications) => {
          return [...notifications, { type: 'error', body: resJSON.err }];
        });
      }

      leaveId.current = null;
      setOpenModal(false);

      setChatRoomList((chatRooms) =>
        chatRooms.filter((chatRoom) => roomId !== chatRoom.id)
      );

      // if user is currently on the page being deleted, redirect them
      if (location.pathname.includes(roomId)) {
        history.push('/');
      }
    } catch (err) {
      setNotifications((notifications) => {
        return [
          ...notifications,
          {
            type: 'error',
            body: 'Error occurred while trying to leave chat room from the sidebar',
          },
        ];
      });
    }
  };

  /**
   * Function to request chat rooms from the server with optional query
   * @param {string} nameFilter optional, specify filter for chat room name
   * @param {string} afterName optional, specify if messages requested should be after a certain room name
   * @param {number} limit optional, maximum number of chat rooms to return
   */
  const fetchFilteredRooms = async (
    nameFilter = null,
    afterName = null,
    limit = 50
  ) => {
    let query = '?';
    if (afterName) query += `after=${afterName}&`;
    query += `limit=${limit}`;

    try {
      const res = await fetch('/api/chatrooms/search' + query, {
        method: 'POST',
        body: JSON.stringify({
          nameFilter: nameFilter || sidebarFilter.nameFilter,
        }),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
        },
      });
      // check if token is expired and could not be renewed
      if (res.tokenExpired) {
        history.push('/login');
        return [];
      }

      const resJSON = await res.json();
      if (resJSON.err) {
        setNotifications((notifications) => {
          return [...notifications, { type: 'error', body: resJSON.err }];
        });
        return [];
      }

      return resJSON;
    } catch (err) {
      setNotifications((notifications) => {
        return [
          ...notifications,
          {
            type: 'error',
            body: 'Error occurred while searching for chat rooms',
          },
        ];
      });
      return [];
    }
  };

  return (
    <React.Fragment>
      <button
        className={`side-menu-btn ${openSideBar ? 'hide' : ''}`}
        onClick={() => {
          setOpenSideBar(true);
        }}
      >
        <FontAwesomeIcon icon={faBars} size="2x" />
      </button>
      <div
        className={`sidebar-wrapper ${
          openSideBar ? '' : 'sidebar-wrapper-hide'
        }`}
      >
        <div className="sidebar" ref={sidebarRef}>
          {openModal && (
            <ConfirmationModal
              title={'Are you sure you want to leave this chat room?'}
              accept={handleLeave}
              decline={() => {
                leaveId.current = null;
                setOpenModal(false);
              }}
            />
          )}
          <SearchBar
            fetchFilteredRooms={fetchFilteredRooms}
            setSidebarFilter={setSidebarFilter}
          />
          <SidebarList
            roomListRef={roomListRef}
            filtered={sidebarFilter.filtered}
            filteredChatRooms={sidebarFilter.filteredChatRooms}
            chatRoomList={props.chatRoomList}
            handleLeaveClick={(event) => {
              leaveId.current = event.currentTarget.dataset.roomId;
              setOpenModal(true);
            }}
            fetchFilteredRooms={fetchFilteredRooms}
            setSidebarFilter={setSidebarFilter}
          />
        </div>
      </div>
    </React.Fragment>
  );
};

export default Sidebar;
