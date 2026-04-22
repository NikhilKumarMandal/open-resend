"use client";

import * as z from "zod";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { GoogleIcon, Logo } from "../auth/icons";
import { useForm } from "@tanstack/react-form";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    email: z.email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters"),
});

type SocialProvider = "google" | "github";


export default function SignUpPage() {

    const FS = "Georgia, 'Times New Roman', serif";


    const router = useRouter();
    const [pendingProvider, setPendingProvider] =
        useState<SocialProvider | null>(null);

    const [isLoading, setIsLoading] =
        useState<boolean>(false);

    const form = useForm({
        defaultValues: { email: "", password: "" },
        validators: {
            onChange: formSchema,
        },
        onSubmit: async ({ value }) => {
            await authClient.signUp.email(
                {
                    name: value.email.split("@")[0],
                    email: value.email,
                    password: value.password,
                    callbackURL: "/",
                },
                {
                    onRequest: (ctx) => {
                        setIsLoading(true);
                    },
                    onSuccess: (ctx) => {
                        setIsLoading(false);
                        toast.success("Account created successfully!");
                        router.push("/");
                    },
                    onError: (ctx) => {
                        setIsLoading(false);
                        toast.error(
                            ctx.error.message || "Registration failed.",
                        );
                    },
                },
            );
        },
    });


    const handleSocialLogin = async (
        provider: SocialProvider,
    ) => {
        setPendingProvider(provider);

        try {
            await authClient.signIn.social({
                provider: provider,
            });
        } catch (err) {
            setPendingProvider(null);
            toast.error("An unexpected error");
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col"
        >
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

                <div className="mb-5">
                    <Logo />
                </div>


                <div className="w-full" style={{ maxWidth: "390px" }}>

                    <div className="px-6 pt-7 pb-6 bg-[#1e1e1e] rounded-t-[14px]">
                        <h1 className="text-[#ede0cc] text-[1.85rem] font-normal tracking-[-0.01em] mb-[6px]" style={{ fontFamily: FS }}>
                            Create account
                        </h1>
                        <p className="mb-5 text-[#6a6a6a] text-[0.85rem]">
                            Already have an account?{" "}
                            <Link
                                href="#"
                                className="text-[#b8a98a] underline underline-offset-[2px] hover:text-[#cbbfa0]"
                            >
                                Login
                            </Link>
                        </p>

                        {/* Google */}
                        <button
                            className="text-center w-full cursor-pointer flex items-center justify-center font-semibold font-mono uppercase border transition-all ease-in duration-75 whitespace-nowrap select-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-2 active:scale-95 text-sm leading-5 rounded-xl px-4 py-1.5 h-8 bg-stone-900 text-white border-2 border-stone-800 hover:bg-stone-800 disabled:bg-stone-700 disabled:border-stone-800 dark:bg-white dark:text-stone-900 dark:border-stone-300 dark:hover:bg-white/80"
                            onClick={() => {
                                handleSocialLogin("google");
                            }}
                        >
                            <GoogleIcon />
                            LOGIN WITH GOOGLE
                        </button>
                    </div>

                    {/* Hairline separator */}
                    <div className="h-[1px] bg-[#111111]" />


                    <div className="px-6 pt-5 pb-7 bg-stone-900 dark:bg-[#141414] rounded-b-[14px]">
                        {/* Email */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                form.handleSubmit();
                            }}>


                            <FieldGroup className="flex flex-col gap-1">
                                {/* Email Field */}
                                <FieldLabel htmlFor="email">Email<span className="text-[#e05252]">*</span></FieldLabel>
                                <form.Field
                                    name="email"
                                    children={(field) => {
                                        const hasError =
                                            field.state.meta.isTouched &&
                                            field.state.meta.errors.length > 0;
                                        return (
                                            <div className="flex flex-col">
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) =>
                                                        field.handleChange(e.target.value)
                                                    }
                                                    type="email"
                                                    placeholder="Email address"
                                                    className={cn(
                                                        "w-full max-h-9 p-2 pl-3 outline-none text-sm rounded-lg border transition-all duration-100  bg - white text - stone - 900 border - stone - 300 hover:border-stone-400 focus-within:border-stone-500 dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700dark:hover:border-stone-600 dark:focus-within:border-stone-500 hover:shadow-input-hover focus-within:shadow-input",
                                                        hasError
                                                            ? "border-red-500 focus:border-red-500 dark:border-red-500"
                                                            : "focus:border-[#676767] dark:focus:border-stone-400"
                                                    )}
                                                />
                                                {/* Reserved space for error to prevent layout shift */}
                                                <div className="min-h-5 px-1 py-0.5">
                                                    {hasError && (
                                                        <FieldError
                                                            className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1 duration-200"
                                                            errors={field.state.meta.errors}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }}
                                />



                                <FieldLabel htmlFor="password">
                                    Password <span className="text-[#e05252]">*</span>
                                </FieldLabel>
                                {/* Password Field */}
                                <form.Field
                                    name="password"
                                    children={(field) => {
                                        const hasError =
                                            field.state.meta.isTouched &&
                                            field.state.meta.errors.length > 0;
                                        return (
                                            <div className="flex flex-col">
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) =>
                                                        field.handleChange(e.target.value)
                                                    }
                                                    type="password"
                                                    placeholder="Password"
                                                    className={cn(
                                                        "w-full max-h-9 p-2 pl-3 outline-none text-sm rounded-lg border transition-all duration-100  bg - white text - stone - 900 border - stone - 300 hover:border-stone-400 focus-within:border-stone-500 dark:bg-stone-900 dark:text-stone-100 dark:border-stone-700dark:hover:border-stone-600 dark:focus-within:border-stone-500 hover:shadow-input-hover focus-within:shadow-input",
                                                        hasError
                                                            ? "border-red-500 focus:border-red-500 dark:border-red-500"
                                                            : "focus:border-[#676767] dark:focus:border-stone-400"
                                                    )}
                                                />
                                                {/* Reserved space for error to prevent layout shift */}
                                                <div className="min-h-5 px-1 py-0.5">
                                                    {hasError && (
                                                        <FieldError
                                                            className="text-xs text-red-500 animate-in fade-in slide-in-from-top-1 duration-200"
                                                            errors={field.state.meta.errors}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }}
                                />

                                {/* Submit Button */}
                                <form.Subscribe
                                    selector={(state) => [
                                        state.canSubmit,
                                        state.isSubmitting,
                                        state.isDirty,
                                    ]}
                                    children={([
                                        canSubmit,
                                        isSubmitting,
                                        isDirty,
                                    ]) => (
                                        <Button
                                            type="submit"
                                            className="text-sm cursor-pointer flex items-center justify-center font-semibold font-mono uppercase border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-2 active:scale-95 leading-5 rounded-xl px-4 py-1.5 h-8 bg-stone-900 text-white dark:bg-[#4f39f6]/80 dark:text-white border-2  dark:hover:bg-[#4f39f6]"
                                            disabled={!canSubmit || !isDirty}>
                                            {isSubmitting || isLoading ? (
                                                <Loader2 className="size-5 animate-spin" />
                                            ) : (
                                                "SIGN UP"
                                            )}
                                        </Button>
                                    )}
                                />
                            </FieldGroup>

                        </form>
                    </div>


                </div>

                <p className="text-center mt-4 text-[#444] text-[0.76rem] max-w-[340px] leading-[1.6]">
                    By signing in, you agree to OpenResend{" "}
                    <Link
                        href="#"
                        className="text-[#5a5a5a] underline underline-offset-[2px] hover:text-[#888]"
                    >
                        Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="#"
                        className="text-[#5a5a5a] underline underline-offset-[2px] hover:text-[#888]"
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
