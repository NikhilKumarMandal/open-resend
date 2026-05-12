"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isAdmin } from "./permissions";

type OrganizationRole = "member" | "admin" | "owner";

async function getAuthHeaders() {
    return headers();
}

export const inviteMember = async (
    email: string,
    role: OrganizationRole = "member",
    organizationId?: string,
) => {
    const admin = await isAdmin();

    if (!admin) {
        return {
            success: false,
            error: "You are not authorized to invite members.",
        };
    }

    try {
        const invitation = await auth.api.createInvitation({
            headers: await getAuthHeaders(),
            body: {
                email,
                role,
                organizationId,
            },
        });

        return {
            success: true,
            data: invitation,
            error: null,
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: "Failed to invite member.",
        };
    }
};

export const removeMember = async (memberIdOrEmail: string, organizationId?: string) => {
    const admin = await isAdmin();

    if (!admin) {
        return {
            success: false,
            error: "You are not authorized to remove members.",
        };
    }

    try {
        const removedMember = await auth.api.removeMember({
            headers: await getAuthHeaders(),
            body: {
                memberIdOrEmail,
                organizationId,
            },
        });

        return {
            success: true,
            data: removedMember,
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

export const updateMemberRole = async (
    memberId: string,
    role: OrganizationRole,
    organizationId?: string,
) => {
    const admin = await isAdmin();

    if (!admin) {
        return {
            success: false,
            error: "You are not authorized to update member roles.",
        };
    }

    try {
        const updatedMember = await auth.api.updateMemberRole({
            headers: await getAuthHeaders(),
            body: {
                memberId,
                role,
                organizationId,
            },
        });

        return {
            success: true,
            data: updatedMember,
            error: null,
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: "Failed to update member role.",
        };
    }
};

export const promoteToAdmin = async (memberId: string, organizationId?: string) => {
    return updateMemberRole(memberId, "admin", organizationId);
};

export const demoteToMember = async (memberId: string, organizationId?: string) => {
    return updateMemberRole(memberId, "member", organizationId);
};

export const cancelInvitation = async (invitationId: string) => {
    const admin = await isAdmin();

    if (!admin) {
        return {
            success: false,
            error: "You are not authorized to cancel invitations.",
        };
    }

    try {
        const invitation = await auth.api.cancelInvitation({
            headers: await getAuthHeaders(),
            body: {
                invitationId,
            },
        });

        return {
            success: true,
            data: invitation,
            error: null,
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: "Failed to cancel invitation.",
        };
    }
};

export const acceptInvitation = async (invitationId: string) => {
    try {
        const result = await auth.api.acceptInvitation({
            headers: await getAuthHeaders(),
            body: {
                invitationId,
            },
        });

        return {
            success: true,
            data: result,
            error: null,
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: "Failed to accept invitation.",
        };
    }
};

export const rejectInvitation = async (invitationId: string) => {
    try {
        const result = await auth.api.rejectInvitation({
            headers: await getAuthHeaders(),
            body: {
                invitationId,
            },
        });

        return {
            success: true,
            data: result,
            error: null,
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: "Failed to reject invitation.",
        };
    }
};
