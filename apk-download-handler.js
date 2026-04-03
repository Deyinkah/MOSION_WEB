const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

loadEnvFile();

const DEFAULT_BETA_APK_OBJECT_URL =
  "https://cinemaapp.s3.eu-central-003.backblazeb2.com/CDN/APK/mosion.apk";
const DEFAULT_BETA_APK_FILENAME = "mosion.apk";
const DEFAULT_BETA_APK_REGION = "eu-central-003";
const DEFAULT_PRESIGN_TTL_SECONDS = 60;
const MAX_PRESIGN_TTL_SECONDS = 604800;
const APK_CONTENT_TYPE = "application/vnd.android.package-archive";
const DOWNLOAD_VARIANTS = {
  root: {
    defaultObjectUrl: DEFAULT_BETA_APK_OBJECT_URL,
    defaultFilename: DEFAULT_BETA_APK_FILENAME,
    objectUrlEnvKeys: [
      "BETA_APK_OBJECT_URL",
      "B2_DOWNLOAD_OBJECT_URL",
      "ROOT_BETA_APK_OBJECT_URL"
    ],
    bucketEnvKeys: ["B2_DOWNLOAD_BUCKET", "B2_BUCKET_NAME"],
    objectKeyEnvKeys: ["B2_DOWNLOAD_OBJECT_KEY", "BETA_APK_OBJECT_KEY"],
    regionEnvKeys: ["B2_DOWNLOAD_REGION", "B2_REGION"],
    endpointEnvKeys: ["B2_DOWNLOAD_ENDPOINT", "B2_S3_ENDPOINT"],
    filenameEnvKeys: ["B2_DOWNLOAD_FILENAME", "BETA_APK_FILENAME"],
    ttlEnvKeys: ["B2_DOWNLOAD_URL_TTL", "BETA_APK_URL_TTL"]
  }
};

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex < 1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

function createHttpError(statusCode, publicMessage, internalMessage = publicMessage) {
  const error = new Error(internalMessage);
  error.statusCode = statusCode;
  error.publicMessage = publicMessage;
  return error;
}

function getFirstEnvValue(keys) {
  for (const key of keys) {
    const value = process.env[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function clampExpiry(value) {
  if (!Number.isFinite(value)) {
    return DEFAULT_PRESIGN_TTL_SECONDS;
  }

  return Math.max(1, Math.min(MAX_PRESIGN_TTL_SECONDS, Math.floor(value)));
}

function escapeRfc3986(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodePathSegments(value) {
  return String(value)
    .split("/")
    .filter(Boolean)
    .map((segment) => escapeRfc3986(segment))
    .join("/");
}

function sha256Hex(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest(encoding);
}

function getSignatureKey(secretKey, dateStamp, region, service) {
  const dateKey = hmac(`AWS4${secretKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, service);
  return hmac(serviceKey, "aws4_request");
}

function formatAmzDate(date = new Date()) {
  const iso = date.toISOString();
  return iso.replace(/[:-]|\.\d{3}/g, "");
}

function parseObjectUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  const hostname = parsed.hostname;
  const lowerHost = hostname.toLowerCase();
  const bucketSegment = ".s3.";
  const backblazeSuffix = ".backblazeb2.com";

  if (lowerHost.includes(bucketSegment) && lowerHost.endsWith(backblazeSuffix)) {
    const markerIndex = lowerHost.indexOf(bucketSegment);
    const bucket = hostname.slice(0, markerIndex);
    const region = hostname.slice(
      markerIndex + bucketSegment.length,
      hostname.length - backblazeSuffix.length
    );

    return {
      bucket,
      objectKey: decodeURIComponent(parsed.pathname.replace(/^\/+/, "")),
      region,
      endpoint: `https://s3.${region}.backblazeb2.com`
    };
  }

  if (lowerHost.startsWith("s3.") && lowerHost.endsWith(backblazeSuffix)) {
    const region = hostname.slice(3, hostname.length - backblazeSuffix.length);
    const [bucket, ...keyParts] = parsed.pathname.replace(/^\/+/, "").split("/");

    return {
      bucket,
      objectKey: decodeURIComponent(keyParts.join("/")),
      region,
      endpoint: `${parsed.protocol}//${hostname}`
    };
  }

  throw createHttpError(
    500,
    "Download is temporarily unavailable.",
    `Unsupported Backblaze object URL: ${rawUrl}`
  );
}

function getDownloadConfig(variantKey = "root") {
  const variant = DOWNLOAD_VARIANTS[variantKey] || DOWNLOAD_VARIANTS.root;
  const sourceUrl =
    getFirstEnvValue(variant.objectUrlEnvKeys) || variant.defaultObjectUrl;

  const parsedConfig = parseObjectUrl(sourceUrl);
  const keyId = getFirstEnvValue([
    "B2_DOWNLOAD_KEY_ID",
    "B2_APPLICATION_KEY_ID",
    "B2_KEY_ID"
  ]);
  const applicationKey = getFirstEnvValue([
    "B2_DOWNLOAD_APPLICATION_KEY",
    "B2_APPLICATION_KEY",
    "B2_SECRET_ACCESS_KEY"
  ]);
  const bucket = getFirstEnvValue(variant.bucketEnvKeys) || parsedConfig.bucket;
  const objectKey = getFirstEnvValue(variant.objectKeyEnvKeys) || parsedConfig.objectKey;
  const region =
    getFirstEnvValue(variant.regionEnvKeys) || parsedConfig.region || DEFAULT_BETA_APK_REGION;
  const endpoint =
    getFirstEnvValue(variant.endpointEnvKeys) ||
    parsedConfig.endpoint ||
    `https://s3.${region}.backblazeb2.com`;
  const filename = getFirstEnvValue(variant.filenameEnvKeys) || variant.defaultFilename;
  const expiresInSeconds = clampExpiry(
    Number(
      getFirstEnvValue(variant.ttlEnvKeys) || DEFAULT_PRESIGN_TTL_SECONDS
    )
  );

  const missingVars = [];

  if (!keyId) {
    missingVars.push("B2_DOWNLOAD_KEY_ID");
  }

  if (!applicationKey) {
    missingVars.push("B2_DOWNLOAD_APPLICATION_KEY");
  }

  if (!bucket) {
    missingVars.push("B2_DOWNLOAD_BUCKET");
  }

  if (!objectKey) {
    missingVars.push("B2_DOWNLOAD_OBJECT_KEY");
  }

  if (!region) {
    missingVars.push("B2_DOWNLOAD_REGION");
  }

  if (missingVars.length) {
    throw createHttpError(
      500,
      "Download is temporarily unavailable.",
      `Missing required beta APK download env vars: ${missingVars.join(", ")}`
    );
  }

  return {
    keyId,
    applicationKey,
    bucket,
    objectKey,
    region,
    endpoint,
    filename,
    expiresInSeconds
  };
}

function buildCanonicalQuery(params) {
  const compareCanonicalParts = (left, right) => {
    if (left === right) {
      return 0;
    }

    return left < right ? -1 : 1;
  };

  return Object.entries(params)
    .map(([key, value]) => [escapeRfc3986(key), escapeRfc3986(value)])
    .sort(([aKey, aValue], [bKey, bValue]) => {
      if (aKey === bKey) {
        return compareCanonicalParts(aValue, bValue);
      }

      return compareCanonicalParts(aKey, bKey);
    })
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function createPresignedUrlForVariant(variantKey = "root", now = new Date()) {
  const config = getDownloadConfig(variantKey);
  const endpointUrl = new URL(config.endpoint);
  const amzDate = formatAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const canonicalUri = `/${encodePathSegments(config.bucket)}/${encodePathSegments(config.objectKey)}`;
  const signedHeaders = "host";
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const queryParams = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.keyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(config.expiresInSeconds),
    "X-Amz-SignedHeaders": signedHeaders,
    "response-content-disposition": `attachment; filename="${config.filename}"`,
    "response-content-type": APK_CONTENT_TYPE
  };
  const canonicalQueryString = buildCanonicalQuery(queryParams);
  const canonicalHeaders = `host:${endpointUrl.host}\n`;
  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD"
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join("\n");
  const signingKey = getSignatureKey(
    config.applicationKey,
    dateStamp,
    config.region,
    "s3"
  );
  const signature = hmac(signingKey, stringToSign, "hex");

  return `${endpointUrl.origin}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

function createBetaApkPresignedUrl(now = new Date()) {
  return createPresignedUrlForVariant("root", now);
}

function sendErrorResponse(res, statusCode, message) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(message);
}

async function handlePresignedApkDownload(req, res, variantKey) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    sendErrorResponse(res, 405, "Method not allowed.");
    return;
  }

  try {
    const signedUrl = createPresignedUrlForVariant(variantKey);

    res.statusCode = 302;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Location", signedUrl);
    res.end();
  } catch (error) {
    console.error("APK download redirect failed:", error.message);
    sendErrorResponse(
      res,
      error.statusCode || 500,
      error.publicMessage || "Download is temporarily unavailable."
    );
  }
}

async function handleBetaApkDownload(req, res) {
  await handlePresignedApkDownload(req, res, "root");
}

module.exports = {
  createBetaApkPresignedUrl,
  handleBetaApkDownload
};
