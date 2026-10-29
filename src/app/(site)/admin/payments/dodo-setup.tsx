"use client";

import { useActionState } from "react";
import { runDodoSetupAction, type DodoSetupState } from "@/app/actions/admin";
import { Button, Notice } from "@/components/ui";

export function DodoSetupButton({ done }: { done: boolean }) {
  const [state, action, pending] = useActionState<DodoSetupState>(runDodoSetupAction, {});
  return (
    <form action={action} className="mt-4 space-y-3">
      <Button type="submit" disabled={pending}>
        {pending ? "Setting up…" : done ? "Re-check Dodo setup" : "Set up Dodo Payments"}
      </Button>
      {state.steps?.length ? (
        <ul className="list-disc space-y-1 pl-5 text-[14px]">
          {state.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      ) : null}
      {state.error ? <Notice tone="error">Dodo said: {state.error}</Notice> : state.ok ? <Notice tone="success">Dodo is connected. You can take a test payment now.</Notice> : null}
    </form>
  );
}
