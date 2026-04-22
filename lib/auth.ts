import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { nextCookies } from "better-auth/next-js";
import { schema } from "@/db/schema/auth-schema";
import { Resend } from "resend";
import ForgotPasswordEmail from "@/components/emails/reset-password";
import VerifyEmail from "@/components/emails/verify-email";
import { organization } from "better-auth/plugins";
import { lastLoginMethod } from "better-auth/plugins";
import { getActiveOrganization } from "@/app/actions/organizations";
import { ac,owner,member,admin } from "./auth/permissions";

const resend = new Resend(process.env.RESEND_API_KEY as string)

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    trustedOrigins: [
        process.env.BETTER_AUTH_URL!
    ],
    
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),

    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            await resend.emails.send({
                from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
                to: user.email,
                subject: "Verify your email",
                react: VerifyEmail({ username: user.name, verifyUrl: url }),
            });
        },
        sendOnSignUp: true,
    },

    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            await resend.emails.send({
                from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
                to: user.email,
                subject: "Reset your password",
                react: ForgotPasswordEmail({
                    username: user.name,
                    resetUrl: url,
                    userEmail: user.email,
                }),
            });
        },
        requireEmailVerification: true,
    },

    socialProviders: {
        google: {
            accessType: "offline",
            prompt: "select_account consent",
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env
                .GOOGLE_CLIENT_SECRET as string,
        },
    },

    databaseHooks: {
        session: {
            create: {
                before: async (session) => {
                    // Implement your custom logic to set initial active organization
                    const organization = await getActiveOrganization(session.userId);
                    return {
                        data: {
                            ...session,
                            activeOrganizationId: organization?.id,
                        },
                    };
                },
            },
        },
    },
    plugins: [
        nextCookies(),
        organization({
        ac,
        roles: {
            owner,
            admin,
            member
        }
    }),
        lastLoginMethod()
    ]
});