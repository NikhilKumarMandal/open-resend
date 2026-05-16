import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SendEmailError, sendApiEmail } from "@/service/emails";

const emailListSchema = z.preprocess(
    (value) => (typeof value === "string" ? [value] : value),
    z.array(z.string().trim().min(1)).min(1),
);

const optionalEmailListSchema = z.preprocess(
    (value) => {
        if (value === undefined) {
            return undefined;
        }

        return typeof value === "string" ? [value] : value;
    },
    z.array(z.string().trim().min(1)).optional(),
);

const sendEmailSchema = z
    .object({
        from: z.string().trim().min(1),
        to: emailListSchema,
        cc: optionalEmailListSchema,
        bcc: optionalEmailListSchema,
        subject: z.string().trim().min(1),
        html: z.string().optional(),
        text: z.string().optional(),
        reply_to: optionalEmailListSchema,
        replyTo: optionalEmailListSchema,
        attachments: z
            .array(
                z.object({
                    filename: z.string().trim().min(1),
                    content: z.string().min(1),
                    content_type: z.string().trim().min(1).optional(),
                    contentType: z.string().trim().min(1).optional(),
                }),
            )
            .optional(),
    })
    .refine((data) => data.html || data.text, {
        message: "Either html or text is required",
        path: ["html"],
    });

function cors(response: NextResponse) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return response;
}

function errorResponse(message: string, status: number, name = "application_error") {
    return cors(NextResponse.json({ name, message }, { status }));
}

function getBearerToken(request: NextRequest) {
    const authorization = request.headers.get("authorization");
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() ?? null;
}

export function handleEmailsOptions() {
    return cors(new NextResponse(null, { status: 200 }));
}

export async function handleSendEmailRequest(request: NextRequest) {
    const apiKey = getBearerToken(request);

    if (!apiKey) {
        return errorResponse(
            "Missing or invalid authorization header",
            401,
            "invalid_api_key",
        );
    }

    try {
        const body = await request.json();
        const data = sendEmailSchema.parse(body);
        const result = await sendApiEmail(apiKey, {
            from: data.from,
            to: data.to,
            cc: data.cc,
            bcc: data.bcc,
            subject: data.subject,
            html: data.html,
            text: data.text,
            replyTo: data.replyTo ?? data.reply_to,
            attachments: data.attachments?.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
                contentType:
                    attachment.contentType ??
                    attachment.content_type ??
                    "application/octet-stream",
            })),
        });

        return cors(NextResponse.json({ id: result.id }, { status: 200 }));
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return errorResponse(
                error.issues[0]?.message ?? "Invalid request data",
                400,
                "validation_error",
            );
        }

        if (error instanceof SendEmailError) {
            const status = error.code === "invalid_api_key" ? 401 : 403;
            return errorResponse(error.message, status, error.code);
        }

        console.error("Send Email Error:", error);
        return errorResponse("Internal server error", 500);
    }
}
