import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOrderForUser } from "@/lib/payments/orders";
import { demoGatewayAction } from "@/app/actions/checkout";
import { Button, Container, Notice } from "@/components/ui";
import { formatInr } from "@/lib/geo";

export const metadata: Metadata = { title: "Demo checkout", robots: { index: false } };

const PURPOSE: Record<string, string> = {
  trip_purchase: "Trip plan",
  tier_upgrade: "Upgrade to 5+ travellers",
  renewal: "New 30-day editing window",
};

export default async function DemoCheckout({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId = "" } = await searchParams;
  const user = await requireUser(`/checkout/demo?order=${orderId}`);
  const order = await getOrderForUser(orderId, user.id);
  if (!order || order.provider !== "mock") redirect("/my/trips");
  if (order.status === "paid") redirect(`/checkout/return?order=${order.id}`);

  const act = (o: "success" | "failure" | "cancel" | "delayed") => demoGatewayAction.bind(null, order.id, o);
  return (
    <Container narrow className="py-12">
      <div className="mx-auto max-w-md rounded-[var(--radius-card)] border-2 border-dashed border-line-strong bg-surface p-6">
        <p className="text-[13px] font-semibold text-warning">Demo payment gateway</p>
        <h1 className="mt-1 text-[32px]">Pay {formatInr(order.amountPaise / 100)}</h1>
        <p className="mt-1 text-ink-soft">
          {PURPOSE[order.purpose]} · {order.tier === "group" ? "5+ travellers" : "1–4 travellers"} · inclusive of applicable taxes
        </p>
        <div className="mt-5">
          <Notice tone="warning">
            This stands in for Dodo Payments until payment keys are added. No card details are collected and no money moves.
          </Notice>
        </div>
        <div className="mt-6 grid gap-3">
          <form action={act("success")}>
            <Button type="submit" className="w-full">
              Pay {formatInr(order.amountPaise / 100)} (test success)
            </Button>
          </form>
          <form action={act("delayed")}>
            <Button type="submit" variant="secondary" className="w-full">
              Pay, but delay confirmation
            </Button>
          </form>
          <form action={act("failure")}>
            <Button type="submit" variant="danger" className="w-full">
              Simulate a declined payment
            </Button>
          </form>
          <form action={act("cancel")}>
            <Button type="submit" variant="ghost" className="w-full">
              Cancel and go back
            </Button>
          </form>
        </div>
      </div>
    </Container>
  );
}
