import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socketClient';

const TypingIndicator = () => {
  const [usernames, setUsernames] = useState([]);
  // track the usernames state in a ref value to access it in event listeners
  const currentUsernames = useRef([]);

  useEffect(() => {
    const typingIndicatorListener = (username) => {
      if (!currentUsernames.current.includes(username)) {
        setUsernames((usernames) => {
          const newArr = [...usernames, username];
          currentUsernames.current = newArr;
          return newArr;
        });
      }
    };
    socket.on('userTyping', typingIndicatorListener);

    const typingStoppedIndicatorListener = (username) => {
      if (currentUsernames.current.includes(username)) {
        setUsernames((usernames) => {
          const newArr = usernames.filter(
            (_username) => _username !== username
          );
          currentUsernames.current = newArr;
          return newArr;
        });
      }
    };
    socket.on('userStoppedTyping', typingStoppedIndicatorListener);

    return () => {
      socket.off('userTyping', typingIndicatorListener);
      socket.off('userStoppedTyping', typingStoppedIndicatorListener);
    };
  }, []);

  let text = '';
  const maxNumberOfUsernames = 3;
  if (usernames.length !== 0) {
    if (usernames.length > maxNumberOfUsernames) {
      text = 'Multiple users are typing...';
    } else {
      for (let i = 0; i < usernames.length; i++) {
        text += usernames[i];
        if (i === usernames.length - 1) {
          text += ` ${usernames.length === 1 ? 'is' : 'are'} typing...`;
        } else {
          if (i === usernames.length - 2) {
            text += ' and ';
          } else {
            text += ', ';
          }
        }
      }
    }
  }

  return <div className="typing-indicator">{text}</div>;
};

export default TypingIndicator;
