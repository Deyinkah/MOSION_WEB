const { handleBetaApkDownload } = require("../apk-download-handler");

module.exports = async (req, res) => {
  await handleBetaApkDownload(req, res);
};
