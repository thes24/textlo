export const formatMessageDate = (date) => {
  const msgDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  if (isSameDay(msgDate, today)) {
    return '오늘';
  }

  if (isSameDay(msgDate, yesterday)) {
    return '어제';
  }

  return msgDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const shouldShowDateDivider = (currMsg, prevMsg) => {
  if (!prevMsg) return true;

  const currDate = new Date(currMsg.createdAt);
  const prevDate = new Date(prevMsg.createdAt);

  return (
    currDate.getFullYear() !== prevDate.getFullYear() ||
    currDate.getMonth() !== prevDate.getMonth() ||
    currDate.getDate() !== prevDate.getDate()
  );
};

export const shouldGroupMessages = (currMsg, prevMsg) => {
  if (!currMsg || !prevMsg) {
    return false;
  }

  if (!currMsg.sender || !prevMsg.sender) {
    return false;
  }
  if (currMsg.sender._id !== prevMsg.sender._id) {
    return false;
  }

  const timeDiff = new Date(currMsg.createdAt) - new Date(prevMsg.createdAt);
  const fiveMin = 5 * 60 * 1000;
  if (timeDiff > fiveMin) return false;

  return true;
};
