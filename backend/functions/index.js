/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Supabase & Firebase Admin if not already initialized
let supabase, serviceAccount;
if (!admin.apps.length) {
  // Supabase
  const supabaseUrl = process.env.SUPABASE_URL || functions.config().supabase.url;
  const supabaseKey = process.env.SUPABASE_KEY || functions.config().supabase.key;
  supabase = createClient(supabaseUrl, supabaseKey);

  // Firebase
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath) {
        serviceAccount = require(serviceAccountPath);
    } else {
        // For production, use environment variables
        serviceAccount = {
            type: functions.config().service_account.type,
            project_id: functions.config().service_account.project_id,
            private_key_id: functions.config().service_account.private_key_id,
            private_key: functions.config().service_account.private_key.replace(/\\n/g, '\n'),
            client_email: functions.config().service_account.client_email,
            client_id: functions.config().service_account.client_id,
            auth_uri: functions.config().service_account.auth_uri,
            token_uri: functions.config().service_account.token_uri,
            auth_provider_x509_cert_url: functions.config().service_account.auth_provider_x509_cert_url,
            client_x509_cert_url: functions.config().service_account.client_x509_cert_url
        };
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
      console.error("Error initializing Firebase Admin SDK:", e);
  }
}

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

exports.api = functions.https.onRequest(app);
