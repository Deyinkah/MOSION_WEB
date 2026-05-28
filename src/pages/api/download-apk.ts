import type { APIRoute } from "astro";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { handleBetaApkDownload } = require("../../../apk-download-handler.js");

export const GET: APIRoute = async ({ request }) => {
  let statusCode = 302;
  const resHeaders: Record<string, string> = {};
  let responseBody = "";

  const fakeReq = {
    method: "GET",
    headers: {},
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

  await handleBetaApkDownload(fakeReq, fakeRes);

  return new Response(responseBody || null, {
    status: statusCode,
    headers: resHeaders,
  });
};
