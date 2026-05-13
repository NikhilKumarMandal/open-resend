import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { retryDomainSetup } from "@/service/domains";

const retryDomainSchema = z.object({
    id: z.string().uuid("Domain id must be a valid UUID"),
});

function getActiveOrganizationId(session: unknown) {
    return (session as { session?: { activeOrganizationId?: string | null } })
        .session?.activeOrganizationId;
}

function cors(response: NextResponse) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return response;
}

async function getSession() {
    return auth.api.getSession({
        headers: await headers(),
    });
}

async function hasDomainCreatePermission(organizationId?: string | null) {
    if (!organizationId) {
        return true;
    }

    const result = await auth.api.hasPermission({
        headers: await headers(),
        body: {
            permissions: {
                domain: ["create"],
            },
        },
    });

    return Boolean(result.success);
}

export function OPTIONS() {
    return cors(new NextResponse(null, { status: 200 }));
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

        if (!(await hasDomainCreatePermission(organizationId))) {
            return cors(NextResponse.json(
                { error: "You are not authorized to retry domain setup" },
                { status: 403 },
            ));
        }

        const id = request.nextUrl.searchParams.get("id");
        const body = id ? { id } : await request.json();
        const validatedData = retryDomainSchema.parse(body);
        const result = await retryDomainSetup({
            userId: session.user.id,
            organizationId,
            domainId: validatedData.id,
        });

        if (!result) {
            return cors(NextResponse.json(
                { error: "Domain not found" },
                { status: 404 },
            ));
        }

        return cors(NextResponse.json({
            success: true,
            data: result,
            message: "Domain setup retried. Please verify the latest DNS records.",
        }));
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return cors(NextResponse.json(
                { error: "Invalid request data", details: error.issues },
                { status: 400 },
            ));
        }

        console.error("Domain Retry Error:", error);
        return cors(NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        ));
    }
}
