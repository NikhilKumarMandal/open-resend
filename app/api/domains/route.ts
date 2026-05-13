import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
    addDomain,
    deleteAccessibleDomain,
    getUserDomains,
    refreshDomainStatus,
} from "@/service/domains";

const addDomainSchema = z.object({
    domain: z
        .string()
        .trim()
        .min(1, "Domain is required")
        .regex(
            /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
            "Domain must be a valid hostname like example.com",
        ),
});

const domainIdSchema = z.object({
    id: z.string().uuid("Domain id must be a valid UUID"),
});

type DomainAction = "read" | "create" | "delete";

function getActiveOrganizationId(session: unknown) {
    return (session as { session?: { activeOrganizationId?: string | null } })
        .session?.activeOrganizationId;
}

function cors(response: NextResponse) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return response;
}

async function getSession() {
    return auth.api.getSession({
        headers: await headers(),
    });
}

async function hasDomainPermission(action: DomainAction, organizationId?: string | null) {
    if (!organizationId) {
        return true;
    }

    const result = await auth.api.hasPermission({
        headers: await headers(),
        body: {
            permissions: {
                domain: [action],
            },
        },
    });

    return Boolean(result.success);
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
                { status: 401 }
            ));
        };

        const organizationId = getActiveOrganizationId(session);

        if (!(await hasDomainPermission("read", organizationId))) {
            return cors(NextResponse.json(
                { error: "You are not authorized to view domains" },
                { status: 403 },
            ));
        }

        const domains = await getUserDomains(
            session.user.id,
            organizationId,
        );

        return cors(NextResponse.json({
            success: true,
            data: { domains },
        }));
    } catch (error) {
        console.error("API Error:", error);
        return cors(NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        ));
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return cors(NextResponse.json(
                { error: "Missing or invalid authorization header" },
                { status: 401 }
            ));
        };

        const organizationId = getActiveOrganizationId(session);

        if (!(await hasDomainPermission("create", organizationId))) {
            return cors(NextResponse.json(
                { error: "You are not authorized to create domains" },
                { status: 403 },
            ));
        }

        const body = await request.json();
        const validatedData = addDomainSchema.parse(body);
        const { domain } = validatedData;

        const result = await addDomain(
            session.user.id,
            domain,
            organizationId,
        );

        return cors(NextResponse.json({
            success: true,
            data: result,
            message: "Domain added successfully. Please verify DNS records.",
        }, { status: 201 }));
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return cors(NextResponse.json(
                {
                    error: "Invalid request data",
                    details: error.issues,
                },
                { status: 400 }
            ));
        }

        console.error("API Error:", error);
        return cors(NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        ));
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return cors(NextResponse.json(
                { error: "Missing or invalid authorization header" },
                { status: 401 },
            ));
        }

        const organizationId = getActiveOrganizationId(session);

        if (!(await hasDomainPermission("read", organizationId))) {
            return cors(NextResponse.json(
                { error: "You are not authorized to verify domains" },
                { status: 403 },
            ));
        }

        const id = request.nextUrl.searchParams.get("id");
        const body = id ? { id } : await request.json();
        const validatedData = domainIdSchema.parse(body);
        const updatedDomain = await refreshDomainStatus({
            userId: session.user.id,
            organizationId,
            domainId: validatedData.id,
        });

        if (!updatedDomain) {
            return cors(NextResponse.json(
                { error: "Domain not found" },
                { status: 404 },
            ));
        }

        return cors(NextResponse.json({
            success: true,
            data: { domain: updatedDomain },
            message: updatedDomain.status === "verified"
                ? "Domain verified"
                : "Domain is still pending DNS verification",
        }));
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return cors(NextResponse.json(
                { error: "Invalid request data", details: error.issues },
                { status: 400 },
            ));
        }

        console.error("API Error:", error);
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

        if (!(await hasDomainPermission("delete", organizationId))) {
            return cors(NextResponse.json(
                { error: "You are not authorized to delete domains" },
                { status: 403 },
            ));
        }

        const id = request.nextUrl.searchParams.get("id");
        const body = id ? { id } : await request.json();
        const validatedData = domainIdSchema.parse(body);
        const deleted = await deleteAccessibleDomain({
            userId: session.user.id,
            organizationId,
            domainId: validatedData.id,
        });

        if (!deleted) {
            return cors(NextResponse.json(
                { error: "Domain not found" },
                { status: 404 },
            ));
        }

        return cors(NextResponse.json({
            success: true,
            message: "Domain deleted",
        }));
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return cors(NextResponse.json(
                { error: "Invalid request data", details: error.issues },
                { status: 400 },
            ));
        }

        console.error("API Error:", error);
        return cors(NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        ));
    }
}
