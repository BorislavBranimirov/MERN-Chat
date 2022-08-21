module.exports.usernamePatternTest = (username) => {
  const usernamePattern = /^[a-zA-Z0-9]{6,25}$/;
  return usernamePattern.test(username);
};

module.exports.passwordPatternTest = (password) => {
  const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,72}$/;
  return passwordPattern.test(password);
};
