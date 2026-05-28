import { createRequire } from 'module';

const require$1 = createRequire(import.meta.url);
const { handleWaitlistSignup } = require$1("../../../waitlist-handler.js");
const POST = async ({ request }) => {
  let parsedBody = {};
  try {
    parsedBody = await request.json();
  } catch {
  }
  let statusCode = 200;
  const resHeaders = {};
  let responseBody = "";
  const fakeReq = {
    method: "POST",
    headers: { origin: request.headers.get("origin") ?? "" },
    body: parsedBody
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
  await handleWaitlistSignup(fakeReq, fakeRes);
  return new Response(responseBody, {
    status: statusCode,
    headers: resHeaders
  });
};
const OPTIONS = async ({ request }) => {
  let statusCode = 204;
  const resHeaders = {};
  let responseBody = "";
  const fakeReq = {
    method: "OPTIONS",
    headers: { origin: request.headers.get("origin") ?? "" },
    body: {}
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
  await handleWaitlistSignup(fakeReq, fakeRes);
  return new Response(responseBody || null, {
    status: statusCode,
    headers: resHeaders
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  OPTIONS,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
