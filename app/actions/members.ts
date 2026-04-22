
"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { member } from "@/db/schema/auth-schema";
import { isAdmin } from "./permissions";



export const removeMember = async (memberId: string) => {
    const admin = await isAdmin();

    if (!admin) {
        return {
            success: false,
            error: "You are not authorized to remove members.",
        };
    }

    try {
        await db.delete(member).where(eq(member.id, memberId));

        return {
            success: true,
            error: null,
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: "Failed to remove member.",
        };
    }
};