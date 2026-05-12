import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { addDomain, getUserDomains } from "@/service/domains";

const addDomainSchema = z.object({
    domain: z.string().trim().min(1, "Domain is required"),
});

function getActiveOrganizationId(session: unknown) {
    return (session as { session?: { activeOrganizationId?: string | null } })
        .session?.activeOrganizationId;
}

function cors(response: NextResponse) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return response;
}

export function OPTIONS() {
    return cors(new NextResponse(null, { status: 200 }));
}

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return cors(NextResponse.json(
                { error: "Missing or invalid authorization header" },
                { status: 401 }
            ));
        };

        const domains = await getUserDomains(
            session.user.id,
            getActiveOrganizationId(session),
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
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return cors(NextResponse.json(
                { error: "Missing or invalid authorization header" },
                { status: 401 }
            ));
        };

        const body = await request.json();
        const validatedData = addDomainSchema.parse(body);
        const { domain } = validatedData;

        const result = await addDomain(
            session.user.id,
            domain,
            getActiveOrganizationId(session),
        );

        return cors(NextResponse.json({
            success: true,
            data: result,
            message: "Domain added successfully. Please verify DNS records.",
        }));
    } catch (error: unknown) {
        const errorObj = error as { errors?: unknown; message?: string };
        if (errorObj.errors || errorObj.message?.includes('validation') || errorObj.message?.includes('parse')) {
            return cors(NextResponse.json(
                {
                    error: "Invalid request data",
                    details: errorObj.errors || errorObj.message,
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
