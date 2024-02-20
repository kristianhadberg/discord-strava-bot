const express = require("express");
const axios = require("axios");
var bodyParser = require("body-parser");

const {
  stravaClientId,
  stravaClientSecret,
  stravaVerifyToken,
  appUrl,
} = require("../config.json");

// TODO: Change this
let tempRefreshToken = "";
let tempAccessToken = "";

const app = express();
app.use(bodyParser.json());

// ENDPOINTS

app.get("/", (req, res) => {
  res.send({ message: "tmp" });
});

app.get("/exchange_token", async (req, res) => {
  const tempCode = req.query.code;
  const tokenUrl = "https://www.strava.com/oauth/token?";
  const tokenResponse = await axios.post(
    tokenUrl,
    {
      client_id: stravaClientId,
      client_secret: stravaClientSecret,
      code: tempCode,
      grant_type: "authorization_code",
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  tempRefreshToken = tokenResponse.data.refresh_token;
  console.log(tempRefreshToken);
  subscribeToStravaHook();

  res.send("Authorized");
});

app.get("/respond_strava", (req, res) => {
  const hubChallenge = req.query["hub.challenge"];
  axios
    .get(
      `${appUrl}?hub.verify_token=${stravaVerifyToken}&hub.challenge=${hubChallenge}&hub.mode=subscribe`
    )
    .then((response) => {
      console.log(response.data);
      res.status(200).json({ "hub.challenge": hubChallenge });
    })
    .catch((error) => {
      console.error("Error making GET request:", error);
      res.sendStatus(500); // Send internal server error status
    });
});

app.post("/respond_strava", async (req, res) => {
  const activityId = req.body["object_id"];
  console.log(req.body);

  try {
    const authToken = await reAuthorize();
    if (req.body["aspect_type"] == "create") {
      axios
        .get(
          `https://www.strava.com/api/v3/activities/${activityId}?access_token=${authToken}`
        )
        .then((response) => {
          console.log(response.data);
        });
    }
  } catch (err) {
    console.error(err);
  }
});

async function subscribeToStravaHook() {
  const hookSubscriptionUrl =
    "https://www.strava.com/api/v3/push_subscriptions?";
  const response = await axios.post(
    hookSubscriptionUrl,
    {
      client_id: stravaClientId,
      client_secret: stravaClientSecret,
      callback_url: `${appUrl}/respond_strava`, // TODO
      verify_token: stravaVerifyToken,
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
}

async function reAuthorize() {
  const auth_link = "https://www.strava.com/oauth/token";
  const response = await axios.post(
    auth_link,
    {
      client_id: stravaClientId,
      client_secret: stravaClientSecret,
      refresh_token: tempRefreshToken,
      grant_type: "refresh_token",
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  tempAccessToken = response.data.access_token;
  console.log(`Access token: `, tempAccessToken);
  return response.data.access_token;
}

module.exports = app;
