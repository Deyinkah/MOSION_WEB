import type { APIRoute } from "astro";

const PARTNER_API_URL =
  process.env.PARTNER_APPLICATIONS_API_URL ||
  process.env.STUDIO_PARTNER_APPLICATIONS_API_URL ||
  "";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidHttpUrl(value: string) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function json(status: number, payload: object) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid request body." });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const email = str(body.email).toLowerCase();
  const firstName = str(body.firstName);
  const lastName = str(body.lastName);
  const companyWebsite = str(body.companyWebsite);
  const filmName = str(body.filmName);
  const origin = str(body.origin);
  const rightsStatus = str(body.rightsStatus);
  const releaseStage = str(body.releaseStage);
  const territoryFocus = str(body.territoryFocus);
  const screenerUrl = str(body.screenerUrl);
  const submissionSummary = str(body.submissionSummary);
  const source = str(body.source) || "studio";

  if (!isValidEmail(email)) return json(400, { error: "Enter a valid email address." });
  if (!firstName) return json(400, { error: "Enter your first name." });
  if (!filmName) return json(400, { error: "Enter your company, slate, or lead title." });
  if (!origin) return json(400, { error: "Select your applicant type." });
  if (!rightsStatus) return json(400, { error: "Select your rights status." });
  if (!releaseStage) return json(400, { error: "Select your release stage." });
  if (!territoryFocus) return json(400, { error: "Enter your primary territories or audience focus." });
  if (!submissionSummary) return json(400, { error: "Share a short submission summary so we can assess fit." });
  if (!isValidHttpUrl(companyWebsite)) return json(400, { error: "Enter a valid website or portfolio URL." });
  if (!isValidHttpUrl(screenerUrl)) return json(400, { error: "Enter a valid trailer or screener URL." });

  if (!PARTNER_API_URL) {
    return json(503, { error: "Partner applications are temporarily unavailable." });
  }

  try {
    const response = await fetch(PARTNER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email, firstName, lastName, companyWebsite, filmName,
        origin, rightsStatus, releaseStage, territoryFocus,
        screenerUrl, submissionSummary, source,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return json(response.status, { error: (result as any).error || "We could not submit your application." });
    return json(200, result);
  } catch {
    return json(502, { error: "Partner applications are temporarily unavailable." });
  }
};
