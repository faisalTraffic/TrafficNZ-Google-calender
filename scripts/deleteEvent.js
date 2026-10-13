
const {
    getEvent,
    deleteEvent,
} = require("../services/calendarService");

function getArgument(name) {
    const prefix = `--${name}=`;
    const argument = process.argv
        .slice(2)
        .find((value) => value.startsWith(prefix));

    return argument ? argument.slice(prefix.length) : undefined;
}

async function main() {
    const eventId = getArgument("id");

    const calendarId =
        getArgument("calendar") ||
        process.env.CALENDAR_ID ||
        "primary";

    const confirmed = process.argv.includes("--confirm-delete");

    if (!eventId) {
        throw new Error(
            "Usage: node scripts/deleteEvent.js --id=EVENT_ID " +
            "[--confirm-delete]"
        );
    }

    const event = await getEvent(eventId, { calendarId });

    console.log("Selected event:");
    console.log(
        JSON.stringify(
            {
                id: event.id,
                title: event.summary || "(Untitled)",
                start: event.start,
                end: event.end,
                organizer: event.organizer?.email || null,
                recurringEventId: event.recurringEventId || null,
            },
            null,
            2
        )
    );

    console.log("Master event details:", {
        id: event.id,
        summary: event.summary,
        status: event.status,
        organizer: event.organizer?.email,
        recurrence: event.recurrence,
        recurringEventId: event.recurringEventId,
        start: event.start,
        end: event.end,
    });

    if (!confirmed) {
        console.log(
            "PREVIEW ONLY: Nothing deleted. " +
            "Verify the event, then rerun with --confirm-delete."
        );
        return;
    }

    await deleteEvent(eventId, {
        calendarId,
        sendUpdates: "none",
    });

    console.log(
        `Deleted event ${eventId} from calendar ${calendarId}.`
    );
}

main().catch((error) => {
    console.error(
        "Calendar operation failed:",
        error.response?.data || error.message
    );
    process.exitCode = 1;
});
