import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
    createAccessibleApiKey,
    deleteAccessibleApiKey,
    getAccessibleApiKeys,
} from "@/service/api-keys";

const apiKeyPermissions = ["send", "receive", "webhooks"] as const;

const createApiKeySchema = z.object({
    domainId: z.string().trim().min(1, "Domain is required"),
    keyName: z.string().trim().min(1, "Key name is required").max(255),
    permissions: z.array(z.enum(apiKeyPermissions)).min(1).default(["send"]),
});

const deleteApiKeySchema = z.object({
    id: z.string().uuid("API key id must be a valid UUID"),
});

type ApiKeyAction = "read" | "create" | "delete";

function cors(response: NextResponse) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return response;
}

async function getSession() {
    return auth.api.getSession({
        headers: await headers(),
    });
}

async function hasApiKeyPermission(action: ApiKeyAction, organizationId?: string | null) {
    if (!organizationId) {
        return true;
    }

    const result = await auth.api.hasPermission({
        headers: await headers(),
        body: {
            permissions: {
                apiKey: [action],
            },
        },
    });

    return Boolean(result.success);
}

function getActiveOrganizationId(session: unknown) {
    return (session as { session?: { activeOrganizationId?: string | null } })
        .session?.activeOrganizationId;
}

export function OPTIONS() {
    return cors(new NextResponse(null, { status: 200 }));
}

export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return cors(NextResponse.json(
                { error: "Missing or invalid authorization header" },
                { status: 401 },
            ));
        }

        const organizationId = getActiveOrganizationId(session);

        if (!(await hasApiKeyPermission("read", organizationId))) {
            return cors(NextResponse.json(
                { error: "You are not authorized to view API keys" },
                { status: 403 },
            ));
        }

        const apiKeys = await getAccessibleApiKeys({
            userId: session.user.id,
            organizationId,
        });

        return cors(NextResponse.json({
            success: true,
            data: { apiKeys },
        }));
    } catch (error) {
        console.error("API Key Error:", error);
        return cors(NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        ));
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return cors(NextResponse.json(
                { error: "Missing or invalid authorization header" },
                { status: 401 },
            ));
        }

        const organizationId = getActiveOrganizationId(session);

        if (!(await hasApiKeyPermission("create", organizationId))) {
            return cors(NextResponse.json(
                { error: "You are not authorized to create API keys" },
                { status: 403 },
            ));
        }

        const body = await request.json();
        const validatedData = createApiKeySchema.parse(body);
        const createdApiKey = await createAccessibleApiKey({
            userId: session.user.id,
            organizationId,
            ...validatedData,
        });

        return cors(NextResponse.json({
            success: true,
            data: { apiKey: createdApiKey },
            message: "API key created. Save it now because it will not be shown again.",
        }, { status: 201 }));
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return cors(NextResponse.json(
                { error: "Invalid request data", details: error.issues },
                { status: 400 },
            ));
        }

        const message = error instanceof Error ? error.message : String(error);

        if (message === "Domain not found") {
            return cors(NextResponse.json(
                { error: "Domain not found" },
                { status: 404 },
            ));
        }

        console.error("API Key Error:", error);
        return cors(NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        ));
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return cors(NextResponse.json(
                { error: "Missing or invalid authorization header" },
                { status: 401 },
            ));
        }

        const organizationId = getActiveOrganizationId(session);

        if (!(await hasApiKeyPermission("delete", organizationId))) {
            return cors(NextResponse.json(
                { error: "You are not authorized to delete API keys" },
                { status: 403 },
            ));
        }

        const id = request.nextUrl.searchParams.get("id");
        const body = id ? { id } : await request.json();
        const validatedData = deleteApiKeySchema.parse(body);
        const deleted = await deleteAccessibleApiKey({
            userId: session.user.id,
            organizationId,
            apiKeyId: validatedData.id,
        });

        if (!deleted) {
            return cors(NextResponse.json(
                { error: "API key not found" },
                { status: 404 },
            ));
        }

        return cors(NextResponse.json({
            success: true,
            message: "API key deleted",
        }));
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return cors(NextResponse.json(
                { error: "Invalid request data", details: error.issues },
                { status: 400 },
            ));
        }

        console.error("API Key Error:", error);
        return cors(NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        ));
    }
}
