/**
 * Security middleware helpers.
 */

/**
 * Redirect HTTP → HTTPS in production.
 * In development/test this is a no-op.
 */
function httpsRedirect(req, res, next) {
  if (
    process.env.NODE_ENV === "production" &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
}

module.exports = { httpsRedirect };
