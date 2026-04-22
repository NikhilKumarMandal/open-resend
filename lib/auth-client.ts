import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { lastLoginMethodClient } from "better-auth/client/plugins";
import { ac, owner, member, admin } from "./auth/permissions";

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: [
        organizationClient({
            ac,
            roles: {
                owner,
                admin,
                member
            }
        }),
        lastLoginMethodClient() 
    ]
})