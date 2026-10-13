const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
require("dotenv").config({
    path: path.resolve(__dirname, "../.env"),
});

// console.log("Environment file:", path.resolve(__dirname, "../.env"));
// console.log("IMPERSONATE_USER:", process.env.IMPERSONATE_USER);

function createCalendarClient() {
    const keyPath = path.resolve(
        __dirname,
        "..",
        process.env.GOOGLE_SERVICE_ACCOUNT_FILE || "service-account.json"
    );

    const impersonateUser = process.env.IMPERSONATE_USER;

    if (!impersonateUser) {
        throw new Error("IMPERSONATE_USER is required.");
    }

    if (!fs.existsSync(keyPath)) {
        throw new Error(`Credentials file not found: ${keyPath}`);
    }

    const credentials = JSON.parse(
        fs.readFileSync(keyPath, "utf8")
    );

    if (credentials.type !== "service_account") {
        throw new Error("Invalid service-account JSON file.");
    }

    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [
            "https://www.googleapis.com/auth/calendar.events",
        ],
        subject: impersonateUser,
    });

    return google.calendar({
        version: "v3",
        auth,
    });
}

module.exports = { createCalendarClient };
