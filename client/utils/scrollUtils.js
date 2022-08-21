export const scrollToTop = (el) => {
  el.scrollTop = 0;
};

export const scrollToBottom = (el) => {
  el.scrollTop = el.scrollHeight;
};

export const atTopOfScroll = (el) => {
  return el.scrollTop === 0;
};

export const atBottomOfScroll = (el) => {
  // check if room list scroll is at the bottom of the element

  // clientHeight - visible room list height excluding borders and margins

  // scrollHeight and clientHeight return integers
  // scrollTop returns decimal or int depending on browser and can sometimes add -/+(0~1)
  // <= is used instead of === for the extra '-' case and 1 is subtracted for the extra '+' case

  // scrollHeight - scrollTop = distance from top of current scroll to bottom of total scroll
  // The scroll bottom is reached if that distance is the same or less than the visible room list height
  return el.scrollHeight - el.scrollTop - 1 <= el.clientHeight;
};
