import { createRequire } from 'module';

const require$1 = createRequire(import.meta.url);
const { handleBetaApkDownload } = require$1("../../../apk-download-handler.js");
const GET = async ({ request }) => {
  let statusCode = 302;
  const resHeaders = {};
  let responseBody = "";
  const fakeReq = {
    method: "GET",
    headers: {}
  };
  const fakeRes = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(v) {
      statusCode = v;
    },
    setHeader(k, v) {
      resHeaders[k] = v;
    },
    end(data) {
      responseBody = data ?? "";
    }
  };
  await handleBetaApkDownload(fakeReq, fakeRes);
  return new Response(responseBody || null, {
    status: statusCode,
    headers: resHeaders
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
