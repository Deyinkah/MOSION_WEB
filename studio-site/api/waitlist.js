const DEFAULT_WAITLIST_API_URL = process.env.WAITLIST_API_URL || "https://www.mosion.app/api/waitlist";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string" && req.body.trim()) {
    return JSON.parse(req.body);
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  return rawBody ? JSON.parse(rawBody) : {};
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const source = typeof body.source === "string" ? body.source.trim().toLowerCase() : "studio";
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const filmName = typeof body.filmName === "string" ? body.filmName.trim() : "";
    const origin = typeof body.origin === "string" ? body.origin.trim() : "";

    if (!isValidEmail(email)) {
      sendJson(res, 400, { error: "Enter a valid email address." });
      return;
    }

    const response = await fetch(DEFAULT_WAITLIST_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ email, source, firstName, lastName, filmName, origin }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      sendJson(res, response.status, {
        error: result.error || "We could not complete your waitlist signup.",
      });
      return;
    }

    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 502, {
      error: "Waitlist signup is temporarily unavailable.",
    });
  }
};
