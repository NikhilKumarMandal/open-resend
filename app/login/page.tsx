"use client";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { GoogleIcon, Logo } from "../auth/icons";





export default function LoginPage() {
  const [showPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const FM = "'DM Mono', 'Courier New', monospace";
  const FS = "Georgia, 'Times New Roman', serif";



  return (
    <div
      className="min-h-screen flex flex-col"
    >
 
      {/* ══ BODY ════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Center logo */}
        <div className="mb-5">
          <Logo />
        </div>

        {/* Card — 390px matches the screenshot */}
        <div className="w-full" style={{ maxWidth: "390px" }}>

          {/* ── Top section ── */}
          <div
            className="px-6 pt-7 pb-6"
            style={{
              backgroundColor: "#1e1e1e",
              borderRadius: "14px 14px 0 0",
            }}
          >
            <h1
              style={{
                color: "#ede0cc",
                fontFamily: FS,
                fontSize: "1.85rem",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                marginBottom: "6px",
              }}
            >
              Login
            </h1>
            <p className="mb-5" style={{ color: "#6a6a6a", fontSize: "0.85rem" }}>
              Don't have an account?{" "}
              <a
                href="#"
                style={{ color: "#b8a98a", textDecoration: "underline", textUnderlineOffset: "2px" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#cbbfa0")}
                onMouseLeave={e => (e.currentTarget.style.color = "#b8a98a")}
              >
                Sign up
              </a>
            </p>

            {/* Google */}
            <button
              className="w-full flex items-center justify-center gap-2 rounded-lg transition-opacity duration-150"
              style={{
                backgroundColor: "#fff",
                border: "none",
                padding: "11px 16px",
                fontFamily: FM,
                fontSize: "0.74rem",
                fontWeight: 700,
                letterSpacing: "0.09em",
                color: "#111",
                cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <GoogleIcon />
              LOGIN WITH GOOGLE
            </button>
          </div>

          {/* Hairline separator */}
          <div style={{ height: "1px", backgroundColor: "#111111" }} />

          {/* ── Bottom section ── */}
          <div
            className="px-6 pt-5 pb-7"
            style={{
              backgroundColor: "#141414",
              borderRadius: "0 0 14px 14px",
            }}
          >
            {/* Email */}
            <div className="mb-4">
              <label
                className="block mb-2 font-medium"
                style={{ color: "#ddd", fontSize: "0.85rem" }}
              >
                Email <span style={{ color: "#e05252" }}>*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium" style={{ color: "#ddd", fontSize: "0.85rem" }}>
                  Password <span style={{ color: "#e05252" }}>*</span>
                </label>
                <Link
                  href="#"
                  className="no-underline"
                  style={{ color: "#555", fontSize: "0.8rem" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#888")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#555")}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {/* Login button */}
            <button
              className="w-full rounded-lg transition-opacity duration-150"
              style={{
                backgroundColor: "#fff",
                border: "none",
                padding: "11px 16px",
                fontFamily: FM,
                fontSize: "0.74rem",
                fontWeight: 700,
                letterSpacing: "0.09em",
                color: "#111",
                cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              LOGIN
            </button>
          </div>
        </div>


        <p
          className="text-center mt-4"
          style={{
            color: "#444",
            fontSize: "0.76rem",
            maxWidth: "340px",
            lineHeight: "1.6",
          }}
        >
          By signing in, you agree to AutoSend{" "}
          <Link
            href="#"
            style={{ color: "#5a5a5a", textDecoration: "underline", textUnderlineOffset: "2px" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#888")}
            onMouseLeave={e => (e.currentTarget.style.color = "#5a5a5a")}
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="#"
            style={{ color: "#5a5a5a", textDecoration: "underline", textUnderlineOffset: "2px" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#888")}
            onMouseLeave={e => (e.currentTarget.style.color = "#5a5a5a")}
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <p className="font-mono-custom text-center pb-7 text-neutral-400 font-bold text-sm tracking-wide">
        © 2026 • OPENRESEND.
      </p>
    </div>
  );
}
