import * as auth from "./auth-schema";
import * as domain from "./domain-schema";
import * as emailLog from "./email-log-schema";

export const schema = {
    ...auth,
    ...domain,
    ...emailLog,
};
