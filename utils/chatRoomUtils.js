module.exports.namePatternTest = (name) => {
  const namePattern = /^[a-zA-Z0-9 ]{6,100}$/;
  return namePattern.test(name);
};

module.exports.passwordPatternTest = (password) => {
  // password of length 0 means no password
  const passwordPattern = /^(.{0}|.{4,72})$/;
  return passwordPattern.test(password);
};
