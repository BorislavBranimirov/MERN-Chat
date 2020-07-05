import React, { useState, useEffect, useRef, useContext } from 'react';
import { NavLink, useLocation, useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SearchBar from './SearchBar';
import ConfirmationModal from './ConfirmationModal';
import UserContext from '../../utils/userContext';
import ChatRoomListContext from '../../utils/chatRoomListContext';
import NotificationContext from '../../utils/notificationContext';
import { scrollToTop, atBottomOfScroll } from '../../utils/scrollUtils';

const Sidebar = (props) => {
    const [openModal, setOpenModal] = useState(false);
    const leaveId = useRef(null);
    const [sidebarFilter, setSidebarFilter] = useState({ filtered: false, filteredChatRooms: [] });
    // lock on lazy load to prevent more requests from being sent if one is currently being handled
    const lazyLoadLock = useRef(false);
    const nameFilter = useRef('');
    const roomListRef = useRef(null);
    const sidebarRef = useRef(null);
    const { loggedUser } = useContext(UserContext);
    const { userChatRoomList, setUserChatRoomList } = useContext(ChatRoomListContext);
    const { setNotifications } = useContext(NotificationContext);
    const location = useLocation();
    const history = useHistory();

    useEffect(() => {
        const fetchChatRooms = async () => {
            try {
                const res = await fetch('/api/users/' + loggedUser + '/chatrooms', {
                    method: 'GET',
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

                setUserChatRoomList(resJSON.map((chatRoom) => {
                    return ({
                        id: chatRoom._id,
                        name: chatRoom.name
                    });
                }));

                props.setSidebarLoaded(true);
            } catch (err) {
                setNotifications((notifications) => {
                    return [...notifications, {
                        type: 'error', body: 'Error occurred while loading sidebar chat room list'
                    }];
                });
            }
        };

        fetchChatRooms();
    }, []);

    useEffect(() => {
        // hide the sidebar when navigating to a different url
        if (sidebarRef.current && !sidebarRef.current.classList.contains('sidebar-wrapper-hide')) {
            document.querySelector('.side-menu-btn').classList.remove('hide');
            sidebarRef.current.parentNode.classList.add('sidebar-wrapper-hide');
        }
    }, [location.pathname]);

    useEffect(() => {
        // for mobile layout sidebar:
        // close mobile sidebar if user clicks outside of it
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                document.querySelector('.side-menu-btn').classList.remove('hide');
                sidebarRef.current.parentNode.classList.add('sidebar-wrapper-hide');
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [sidebarRef]);

    const handleLeave = async () => {
        const roomId = leaveId.current;

        try {
            const res = await fetch('/api/chatrooms/' + roomId + '/logout', {
                method: 'POST',
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

            leaveId.current = null;
            setOpenModal(false);

            setUserChatRoomList((chatRooms) => chatRooms.filter((chatRoom) => roomId !== chatRoom.id));

            // if user is currently on the page being deleted, redirect them
            const currentChatRoomId = location.pathname.split('/chatrooms/').pop();
            if (currentChatRoomId === roomId || currentChatRoomId === roomId + '/') {
                history.push('/');
            }
        } catch (err) {
            setNotifications((notifications) => {
                return [...notifications, {
                    type: 'error', body: 'Error occurred while trying to leave chat room from the sidebar'
                }];
            });
        }
    };

    const handleLeaveClick = (event) => {
        leaveId.current = event.currentTarget.dataset.roomId;
        setOpenModal(true);
    };

    /**
     * Function to request chat rooms from the server with optional query
     * @param {string} afterName optional, specify if messages requested should be after a certain room name
     * @param {(string|number)} limit optional, maximum number of chat rooms to return
     */
    const fetchRooms = async (afterName = null, limit = 50) => {
        let query = '?';
        if (afterName) query += `after=${afterName}&`;
        query += `limit=${limit}`;

        try {
            const res = await fetch('/api/chatrooms/search' + query, {
                method: 'POST',
                body: JSON.stringify({ nameFilter: nameFilter.current }),
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                }
            });
            // check if token is expired expired and could not be renewed
            if (res.tokenExpired) {
                history.push('/login');
                return [];
            }

            const resJSON = await res.json();
            // check if an error was returned
            if (resJSON.err) {
                setNotifications((notifications) => {
                    return [...notifications, { type: 'error', body: resJSON.err }];
                });
                return [];
            }

            return resJSON;
        } catch (err) {
            setNotifications((notifications) => {
                return [...notifications, { type: 'error', body: 'Error occurred while searching for chat rooms' }];
            });
            return [];
        }
    };

    const search = async (newNameFilter = '') => {
        nameFilter.current = newNameFilter;

        // reset scroll when switching between filtered and user room list
        scrollToTop(roomListRef.current);

        const filteredChatRooms = await fetchRooms();

        setSidebarFilter({
            filtered: true,
            filteredChatRooms
        });
    };

    const clearSearch = () => {
        nameFilter.current = '';

        // reset scroll when switching between filtered and user room list
        scrollToTop(roomListRef.current);

        setSidebarFilter({
            filtered: false,
            filteredChatRooms: []
        });
    };

    const lazyLoad = async () => {
        if (!lazyLoadLock.current) {
            lazyLoadLock.current = true;

            const lastChatRoom = sidebarFilter.filteredChatRooms[sidebarFilter.filteredChatRooms.length - 1];

            const newChatRooms = await fetchRooms(lastChatRoom.name);

            lazyLoadLock.current = false;

            // if no new rooms were found, don't update the state
            if (newChatRooms.length === 0)
                return;

            setSidebarFilter((sidebarFilter) => {
                return ({
                    filtered: true,
                    filteredChatRooms: [...sidebarFilter.filteredChatRooms, ...newChatRooms]
                });
            });
        }
    }

    const handleScroll = (event) => {
        if (sidebarFilter.filtered && atBottomOfScroll(roomListRef.current)) {
            lazyLoad();
        }
    }

    let chatRoomLinks = [];
    if (sidebarFilter.filtered) {
        chatRoomLinks = sidebarFilter.filteredChatRooms.map((chatRoom) => {
            return (
                <li key={chatRoom._id}>
                    <NavLink exact to={'/chatrooms/' + chatRoom._id} activeClassName="active-room">
                        {chatRoom.name}
                        {
                            (chatRoom.hasPassword) ? (
                                <FontAwesomeIcon icon="lock" className="room-list-lock-icon" size="lg" />
                            ) : ('')
                        }
                    </NavLink>
                </li>
            );
        });
    } else {
        chatRoomLinks = userChatRoomList.map((chatRoom) => {
            return (
                <li key={chatRoom.id}>
                    <NavLink exact to={'/chatrooms/' + chatRoom.id} activeClassName="active-room">
                        {chatRoom.name}
                    </NavLink>
                    <button
                        className="leave-room-btn"
                        type="button"
                        data-room-id={chatRoom.id}
                        onClick={handleLeaveClick}
                    >
                        <FontAwesomeIcon icon="times" size="lg" />
                    </button>
                </li>
            );
        });
    }

    return (
        <div className="sidebar-wrapper sidebar-wrapper-hide">
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
                    search={search}
                    clearSearch={clearSearch}
                />
                {(sidebarFilter.filtered) && <p className="found-rooms-message">Found rooms:</p>}
                <ul
                    ref={roomListRef}
                    className="room-list"
                    onScroll={handleScroll}
                >
                    {chatRoomLinks}
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;