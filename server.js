// Allow CORS function to handle preflight and set headers
const allowCors = (fn) => async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end(); // End preflight requests with status 200
    return;
  }

  return await fn(req, res); // Continue to the actual request handler
};

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || "0.0.0.0";
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Set originWhitelist to an empty array to allow all origins
var originWhitelist = []; // Allow all origins

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require("./lib/rate-limit")(
  process.env.CORSANYWHERE_RATELIMIT
);

var cors_proxy = require("./lib/cors-anywhere");
cors_proxy
  .createServer({
    originWhitelist: originWhitelist, // This allows all origins
    requireHeader: ["origin", "x-requested-with"],
    checkRateLimit: checkRateLimit,
    removeHeaders: [
      "cookie",
      "cookie2",
      // Strip Heroku-specific headers
      "x-request-start",
      "x-request-id",
      "via",
      "connect-time",
      "total-route-time",
    ],
    redirectSameOrigin: false, // Prevent redirects for same-origin requests
    httpProxyOptions: {
      xfwd: false,
    },
  })
  .listen(port, host, function () {
    console.log("Running CORS Anywhere on " + host + ":" + port);
  });

// Wrap the server with the allowCors function
module.exports = allowCors((req, res) => {
  res.end("CORS Proxy is running");
});
