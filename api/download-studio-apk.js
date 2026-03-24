const { handleStudioBetaApkDownload } = require("../apk-download-handler");

module.exports = async (req, res) => {
  await handleStudioBetaApkDownload(req, res);
};
