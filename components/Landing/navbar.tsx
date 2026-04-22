"use client";

import { Logo } from "@/app/auth/icons";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const MenuIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

type NavLink = {
    label: string;
    icon?: React.ReactNode;
};

const navLinks: NavLink[] = [
    { label: "SOLUTIONS", icon: <ChevronDown size={13} /> },
    { label: "AGENTS" },
    { label: "PRICING" },
    { label: "DOCS", icon: <ArrowUpRight size={13} /> },
    { label: "BLOG" },
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Main Navbar */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 h-14 bg-[#111] border-b border-[#1c1c1c]">

                {/* Brand */}
                <Link href="#" className="flex items-center gap-2.5 no-underline">
                    <Logo/>
                    <span className="text-white font-mono text-[0.82rem] font-bold tracking-[0.15em]">
                        OPENRESEND
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map(({ label, icon }) => (
                        <Link
                            key={label}
                            href="#"
                            className="flex items-center gap-1 no-underline text-[#999] hover:text-white font-mono text-[0.75rem] font-bold tracking-[0.06em] px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors duration-150"
                        >
                            {label}
                            {icon && <span className="opacity-60">{icon}</span>}
                        </Link>
                    ))}
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2">

                    {/* Login */}
                    <Link
                        href="#"
                        className="hidden md:inline-flex items-center no-underline text-white font-mono text-[0.75rem] font-bold tracking-[0.08em] px-5 py-2 rounded-lg border border-[#333] hover:border-[#555] hover:bg-[#1c1c1c] transition-all duration-150"
                    >
                        LOG IN
                    </Link>

                    {/* SIGN UP — desktop only */}
                    <Link
                        href="#"
                        className="hidden md:inline-flex items-center no-underline text-white font-mono text-[0.75rem] font-bold tracking-[0.08em] px-5 py-2 rounded-lg bg-[#5b4ef8] border border-[#7060fa] hover:bg-[#6b5ef8] transition-all duration-150"
                    >
                        SIGN UP
                    </Link>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden flex items-center justify-center p-1 ml-1 text-[#888]"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <CloseIcon /> : <MenuIcon />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden flex flex-col bg-[#161616] border-b border-[#1e1e1e] px-6 pb-5">
                    {navLinks.map(({ label, icon }) => (
                        <Link
                            key={label}
                            href="#"
                            className="flex items-center justify-between no-underline text-[#ccc] font-mono text-[0.82rem] font-bold tracking-[0.08em] py-4 border-b border-[#1e1e1e]"
                        >
                            {label}
                            {icon && <span className="opacity-50">{icon}</span>}
                        </Link>
                    ))}

                    {/* Mobile Buttons */}
                    <div className="flex items-center gap-3 pt-5">
                        <Link
                            href="#"
                            className="flex-1 text-center no-underline text-white font-mono text-[0.75rem] font-bold py-2 rounded-lg border border-[#333] hover:bg-[#1c1c1c]"
                        >
                            LOG IN
                        </Link>
                        <Link
                            href="#"
                            className="flex-1 text-center no-underline text-white font-mono text-[0.75rem] font-bold py-2 rounded-lg bg-[#5b4ef8] border border-[#7060fa] hover:bg-[#6b5ef8]"
                        >
                            SIGN UP
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}