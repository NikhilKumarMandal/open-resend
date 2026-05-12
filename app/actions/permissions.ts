"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const isAdmin = async () => {
    try {
        const { success, error } = await auth.api.hasPermission({
            headers: await headers(),
            body: {
                permissions: {
                    member: ["update", "delete"],
                    invitation: ["create", "cancel"],
                },
            },
        });

        if (error) {
            return false;
        }

        return success;
    } catch (error) {
        console.error(error);
        return false;
    }
};
