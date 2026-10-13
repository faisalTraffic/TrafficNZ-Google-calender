
const { listEvents } = require("../services/calendarService");

function getArgument(name) {
    const prefix = `--${name}=`;
    const argument = process.argv
        .slice(2)
        .find((value) => value.startsWith(prefix));

    return argument ? argument.slice(prefix.length) : undefined;
};

async function main() {
    const calendarId =
        getArgument("calendar") ||
        process.env.CALENDAR_ID ||
        "primary";

    const query = getArgument("query");
    const expandRecurring =
        process.argv.includes("--expand-recurring");

    const events = await listEvents({
        calendarId,
        query,
        singleEvents: expandRecurring,
    });

    console.log(`Calendar: ${calendarId}`);
    console.log(`Events found: ${events.length}`);

    for (const event of events) {
        console.log(
            JSON.stringify(
                {
                    id: event.id,
                    title: event.summary || "(Untitled)",
                    status: event.status,
                    start: event.start,
                    end: event.end,
                    organizer: event.organizer?.email || null,
                    recurringEventId: event.recurringEventId || null,
                    htmlLink: event.htmlLink || null,
                },
                null,
                2
            )
        );
    }
};

main().catch((error) => {
    console.error(
        "Failed to list events:",
        error.response?.data || error.message
    );
    process.exitCode = 1;
});
