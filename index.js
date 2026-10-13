
require("dotenv").config();
const { google } = require("googleapis");
const path = require("path");

async function main() {
    const keyFile = require(
        path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_FILE)
    );

    const auth = new google.auth.JWT({
        email: keyFile.client_email,
        key: keyFile.private_key,
        scopes: [
            "https://www.googleapis.com/auth/calendar.events",
        ],
        subject: process.env.IMPERSONATE_USER,
    });

    const calendar = google.calendar({
        version: "v3",
        auth,
    });

    const calendarId = "primary";
    const eventId = process.env.EVENT_ID;
    const dryRun = process.env.DRY_RUN !== "false";

    // Retrieve the exact event from the attendee's calendar.
    const response = await calendar.events.get({
        calendarId,
        eventId,
    });

    const event = response.data;

    console.log("Event found:");
    console.log({
        id: event.id,
        title: event.summary,
        organizer: event.organizer?.email ?? "No organizer",
        recurringEventId: event.recurringEventId,
        start: event.start,
        status: event.status,
    });

    // Stop if this is not the expected orphaned event.
    if (event.organizer?.email) {
        throw new Error(
            "An organizer is still listed. Verify this is the correct orphaned event before proceeding."
        );
    }

    if (dryRun) {
        console.log(
            "PREVIEW ONLY: No event deleted. " +
            "Verify the event details before proceeding."
        );
        return;
    }

    await calendar.events.delete({
        calendarId,
        eventId: event.id,
        sendUpdates: "none",
    });

    console.log("Event deleted from this calendar.");
}

main().catch((error) => {
    console.error(
        "Calendar API error:",
        error.response?.data || error.message
    );
    process.exitCode = 1;
});
