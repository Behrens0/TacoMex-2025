const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Firebase Admin
const serviceAccount = {
  type: process.env.SERVICE_ACCOUNT_TYPE,
  project_id: process.env.SERVICE_ACCOUNT_PROJECT_ID,
  private_key_id: process.env.SERVICE_ACCOUNT_PRIVATE_KEY_ID,
  private_key: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
  client_id: process.env.SERVICE_ACCOUNT_CLIENT_ID,
  auth_uri: process.env.SERVICE_ACCOUNT_AUTH_URI,
  token_uri: process.env.SERVICE_ACCOUNT_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.SERVICE_ACCOUNT_CLIENT_X509_CERT_URL,
  universe_domain: process.env.SERVICE_ACCOUNT_UNIVERSE_DOMAIN
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.post("/notify-owner", async (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).send({ error: "Title and body are required." });
  }

  try {
    const { data: supervisors, error } = await supabase
      .from("supervisores")
      .select("fcm_token")
      .in("perfil", ["dueño", "supervisor"]);

    if (error) {
      throw new Error(`Error fetching supervisors: ${error.message}`);
    }

    if (!supervisors || supervisors.length === 0) {
      console.log("No owner or supervisors found to notify.");
      return res
        .status(200)
        .send({ message: "No owner or supervisors to notify." });
    }

    const tokens = supervisors.map((s) => s.fcm_token).filter((t) => t);

    if (tokens.length === 0) {
      console.log("No valid FCM tokens found for owner or supervisors.");
      return res.status(200).send({ message: "No valid FCM tokens found." });
    }

    const message = {
      notification: {
        title: title,
        body: body,
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("Successfully sent message:", response);

    res
      .status(200)
      .send({ message: "Notification sent successfully.", response });
  } catch (error) {
    console.error("Error sending notification:", error);
    res
      .status(500)
      .send({ error: `Failed to send notification: ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
}); 