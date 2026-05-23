import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/sidebar/app-sidebar";

export default async function ChatPageLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="flex flex-col h-dvh  bg-[#212121] text-[#ececec]">
                    <main className="flex-1 min-h-0 relative flex flex-col">
                        {children}
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
