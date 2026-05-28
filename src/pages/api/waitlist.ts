import type { APIRoute } from "astro";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { handleWaitlistSignup } = require("../../../waitlist-handler.js");

export const POST: APIRoute = async ({ request }) => {
  let parsedBody: Record<string, unknown> = {};
  try {
    parsedBody = await request.json();
  } catch {
    // empty body
  }

  let statusCode = 200;
  const resHeaders: Record<string, string> = {};
  let responseBody = "";

  const fakeReq = {
    method: "POST",
    headers: { origin: request.headers.get("origin") ?? "" },
    body: parsedBody,
  };

  const fakeRes = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(v: number) {
      statusCode = v;
    },
    setHeader(k: string, v: string) {
      resHeaders[k] = v;
    },
    end(data: string) {
      responseBody = data ?? "";
    },
  };

  await handleWaitlistSignup(fakeReq, fakeRes);

  return new Response(responseBody, {
    status: statusCode,
    headers: resHeaders,
  });
};

export const OPTIONS: APIRoute = async ({ request }) => {
  let statusCode = 204;
  const resHeaders: Record<string, string> = {};
  let responseBody = "";

  const fakeReq = {
    method: "OPTIONS",
    headers: { origin: request.headers.get("origin") ?? "" },
    body: {},
  };

  const fakeRes = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(v: number) {
      statusCode = v;
    },
    setHeader(k: string, v: string) {
      resHeaders[k] = v;
    },
    end(data?: string) {
      responseBody = data ?? "";
    },
  };

  await handleWaitlistSignup(fakeReq, fakeRes);

  return new Response(responseBody || null, {
    status: statusCode,
    headers: resHeaders,
  });
};
