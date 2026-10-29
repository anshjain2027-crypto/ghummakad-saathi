import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, authMode, safeNext } from "@/lib/auth";
import { Container } from "@/components/ui";
import { Scene } from "@/components/scene";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);

  const reason =
    next.startsWith("/map") || next.startsWith("/places") || next.startsWith("/discover")
      ? "The community map is free — it just needs a free account so places and reviews stay genuine."
      : next.startsWith("/plan")
        ? "Sign in so your trip is saved to your account before you unlock it."
        : next.startsWith("/admin")
          ? "Admin access needs a signed-in account with the right role."
          : "Sign in or create a free account with just your email.";

  return (
    <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:py-20">
      <div className="max-w-md">
        <h1 className="text-[40px] sm:text-[48px]">Welcome, explorer.</h1>
        <p className="mt-3 text-[17px] text-ink-soft">{reason}</p>
        {sp.error === "link" ? (
          <p role="alert" className="mt-6 rounded-[12px] border border-sand bg-sand-soft px-4 py-3 text-[15px]">
            That sign-in link has expired or was opened in a different browser. Enter your email again and open the new link in this same browser.
          </p>
        ) : null}
        <div className="mt-8">
          <SignInForm next={next} demo={authMode === "demo"} />
        </div>
        <p className="mt-6 text-[13px] text-ink-soft">
          New here? Entering your email creates a free account. We only use it to sign you in and send trip receipts.
        </p>
      </div>
      <Scene kind="lake" seed="sign-in" label="A calm mountain lake" className="hidden aspect-[4/5] rounded-[var(--radius-card)] lg:block" />
    </Container>
  );
}
