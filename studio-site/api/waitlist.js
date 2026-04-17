const DEFAULT_PARTNER_APPLICATIONS_API_URL =
  process.env.PARTNER_APPLICATIONS_API_URL ||
  process.env.STUDIO_PARTNER_APPLICATIONS_API_URL ||
  process.env.WAITLIST_API_URL ||
  "https://www.mosion.app/api/partner-applications";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidHttpUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
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
    const companyWebsite =
      typeof body.companyWebsite === "string" ? body.companyWebsite.trim() : "";
    const filmName = typeof body.filmName === "string" ? body.filmName.trim() : "";
    const origin = typeof body.origin === "string" ? body.origin.trim() : "";
    const rightsStatus =
      typeof body.rightsStatus === "string" ? body.rightsStatus.trim() : "";
    const releaseStage =
      typeof body.releaseStage === "string" ? body.releaseStage.trim() : "";
    const territoryFocus =
      typeof body.territoryFocus === "string" ? body.territoryFocus.trim() : "";
    const screenerUrl =
      typeof body.screenerUrl === "string" ? body.screenerUrl.trim() : "";
    const submissionSummary =
      typeof body.submissionSummary === "string"
        ? body.submissionSummary.trim()
        : "";

    if (!isValidEmail(email)) {
      sendJson(res, 400, { error: "Enter a valid email address." });
      return;
    }

    if (!firstName) {
      sendJson(res, 400, { error: "Enter your first name." });
      return;
    }

    if (!filmName) {
      sendJson(res, 400, { error: "Enter your company, slate, or lead title." });
      return;
    }

    if (!origin) {
      sendJson(res, 400, { error: "Select your applicant type." });
      return;
    }

    if (!rightsStatus) {
      sendJson(res, 400, { error: "Select your rights status." });
      return;
    }

    if (!releaseStage) {
      sendJson(res, 400, { error: "Select your release stage." });
      return;
    }

    if (!territoryFocus) {
      sendJson(res, 400, { error: "Enter your primary territories or audience focus." });
      return;
    }

    if (!submissionSummary) {
      sendJson(res, 400, { error: "Share a short submission summary so we can assess fit." });
      return;
    }

    if (!isValidHttpUrl(companyWebsite)) {
      sendJson(res, 400, { error: "Enter a valid website or portfolio URL." });
      return;
    }

    if (!isValidHttpUrl(screenerUrl)) {
      sendJson(res, 400, { error: "Enter a valid trailer or screener URL." });
      return;
    }

    const response = await fetch(DEFAULT_PARTNER_APPLICATIONS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        companyWebsite,
        email,
        filmName,
        firstName,
        lastName,
        origin,
        releaseStage,
        rightsStatus,
        screenerUrl,
        source,
        submissionSummary,
        territoryFocus,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      sendJson(res, response.status, {
        error: result.error || "We could not submit your application.",
      });
      return;
    }

    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 502, {
      error: "Partner applications are temporarily unavailable.",
    });
  }
};
