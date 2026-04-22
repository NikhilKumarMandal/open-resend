"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { member, organization } from "@/db/schema/auth-schema";


export async function getActiveOrganization(userId: string) {
    const memberUser = await db.query.member.findFirst({
        where: eq(member.userId, userId),
    });

    if (!memberUser) {
        return null;
    }

    const activeOrganization = await db.query.organization.findFirst({
        where: eq(organization.id, memberUser.organizationId),
    });

    return activeOrganization;
}
