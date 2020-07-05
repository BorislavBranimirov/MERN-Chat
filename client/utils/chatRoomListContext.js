import React from 'react';

const ChatRoomListContext = React.createContext({
    userChatRoomList: [],
    setUserChatRoomList: () => { }
});

export default ChatRoomListContext;