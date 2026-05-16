import { type NextRequest } from "next/server";
import {
    handleEmailsOptions,
    handleSendEmailRequest,
} from "@/service/email-api";

export function OPTIONS() {
    return handleEmailsOptions();
}

export async function POST(request: NextRequest) {
    return handleSendEmailRequest(request);
}
