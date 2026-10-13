// This is your reusable service layer. Future functionality, 
// such as creating events, updating meetings, or retrieving calendars, 
// can be added here.

// Important: The functions above operate on the calendar belonging to the impersonated user 
// unless you explicitly provide another calendar ID.
// The impersonated user must be authorised to access that calendar.

const { createCalendarClient } = require("../auth/googleAuth");

const calendar = createCalendarClient();

function getCalendarId(calendarId) {
    return calendarId || process.env.CALENDAR_ID || "primary";
}

// List events, automatically handling pagination.
async function listEvents(options = {}) {
    const calendarId = getCalendarId(options.calendarId);
    const events = [];
    let pageToken;

    do {
        const response = await calendar.events.list({
            calendarId,
            timeMin: options.timeMin || process.env.TIME_MIN,
            timeMax: options.timeMax || undefined,
            q: options.query || undefined,
            maxResults: Math.min(options.maxResults || 100, 2500),
            singleEvents: options.singleEvents === true,
            orderBy:
                options.singleEvents === true ? "startTime" : undefined,
            showDeleted: false,
            pageToken,
        });

        events.push(...(response.data.items || []));
        pageToken = response.data.nextPageToken;
    } while (pageToken);

    return events;
}

// Get a single event by its exact ID.
async function getEvent(eventId, options = {}) {
    if (!eventId) {
        throw new Error("An event ID is required.");
    }

    const response = await calendar.events.get({
        calendarId: getCalendarId(options.calendarId),
        eventId,
    });

    return response.data;
}

const event = getEvent("02rsac6qreq6vlut4c14pfhho5_20281011T053000Z", { calendarId: "primary" }).then((event) => {
    console.log({
        id: event.id,
        summary: event.summary,
        status: event.status,
        organizer: event.organizer?.email,
        recurringEventId: event.recurringEventId,
        recurrence: event.recurrence,
    });
});

// Delete a single event by its exact ID.
async function deleteEvent(eventId, options = {}) {
    if (!eventId) {
        throw new Error("An event ID is required.");
    }

    const calendarId =
        options.calendarId || process.env.CALENDAR_ID || "primary";

    try {
        await calendar.events.delete({
            calendarId,
            eventId,
            sendUpdates: options.sendUpdates || "none",
        });

        return { calendarId, eventId, success: true };
    } catch (err) {
        console.error("Google Calendar delete failed:", {
            status: err.code,
            message: err.message,
            calendarId,
            eventId,
            details: err.errors || err.response?.data?.error,
        });

        throw err;
    }
};

module.exports = {
    listEvents,
    getEvent,
    deleteEvent,
};
