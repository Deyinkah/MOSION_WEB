(function redirectAuthenticatedStudioUser(window) {
  "use strict";

  var sessionKey = "mosion_auth_session_v1";
  var dashboardUrl = new URL("./dashboard", window.location.href);

  function hasUsableSession(rawValue) {
    if (!rawValue) {
      return false;
    }

    var normalizedValue = String(rawValue).trim();

    if (
      !normalizedValue ||
      normalizedValue === "null" ||
      normalizedValue === "undefined" ||
      normalizedValue === "false"
    ) {
      return false;
    }

    try {
      var parsedValue = JSON.parse(normalizedValue);

      if (!parsedValue || typeof parsedValue !== "object") {
        return false;
      }

      var currentUser = parsedValue.currentUser;
      var authToken =
        typeof parsedValue.authToken === "string"
          ? parsedValue.authToken.trim()
          : "";

      if (
        authToken &&
        currentUser &&
        String(currentUser.role || "").trim().toLowerCase() === "producer"
      ) {
        return true;
      }

      var expiresAt = parsedValue.expires_at || parsedValue.expiresAt;

      if (typeof expiresAt === "number" && expiresAt > 0) {
        if (expiresAt > 1000000000000) {
          return expiresAt > Date.now();
        }

        return expiresAt * 1000 > Date.now();
      }

      return Boolean(
        parsedValue.access_token ||
          parsedValue.accessToken ||
          parsedValue.refresh_token ||
          parsedValue.refreshToken ||
          parsedValue.token ||
          parsedValue.session ||
          parsedValue.currentSession ||
          parsedValue.user
      );
    } catch (error) {
      return (
        normalizedValue.length > 24 &&
        (normalizedValue.indexOf(".") !== -1 ||
          /token|session|refresh|access|auth/i.test(normalizedValue))
      );
    }
  }

  try {
    if (hasUsableSession(window.localStorage.getItem(sessionKey))) {
      window.location.replace(dashboardUrl.href);
    }
  } catch (error) {
    /* Ignore storage access issues and continue to the landing page. */
  }
})(window);
