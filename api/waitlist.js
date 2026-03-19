const { handleWaitlistSignup } = require("../waitlist-handler");

module.exports = async (req, res) => {
  await handleWaitlistSignup(req, res);
};
