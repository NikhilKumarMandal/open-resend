import * as auth from "./auth-schema";
import * as apiKey from "./api-key-schema";
import * as domain from "./domain-schema";
import * as emailLog from "./email-log-schema";
import * as webhookEvent from "./webhook-event-schema";

export const schema = {
    ...auth,
    ...apiKey,
    ...domain,
    ...emailLog,
    ...webhookEvent,
};
