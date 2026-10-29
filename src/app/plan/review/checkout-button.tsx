"use client";

import { useActionState } from "react";
import { startTripCheckout, type CheckoutState } from "@/app/actions/checkout";
import { Button, Notice } from "@/components/ui";

export function CheckoutButton({ label }: { label: string }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startTripCheckout, {});
  return (
    <form action={action} className="space-y-3">
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Button type="submit" disabled={pending} className="min-h-12 w-full text-[16px]">
        {pending ? "Opening secure checkout…" : label}
      </Button>
    </form>
  );
}
