import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Refunds" };

export default function Refunds() {
  return (
    <LegalPage title="Refund and cancellation policy" updated="29 October 2026">
      <p>The final refund policy needs the owner&rsquo;s decision and legal review. Until then, this is the working policy.</p>
      <h2>Trip plans</h2>
      <ul>
        <li>If your plan failed to generate, or you were charged twice, we refund the affected payment in full.</li>
        <li>If you&rsquo;re unhappy, contact us within 7 days of payment and we&rsquo;ll review the request.</li>
        <li>Reducing your group from 5+ to 1–4 travellers doesn&rsquo;t trigger an automatic partial refund.</li>
      </ul>
      <h2>Bookings with partners</h2>
      <p>Hotels, flights, trains and activities are booked with third parties. Their own cancellation and refund rules apply; we can&rsquo;t cancel or refund those bookings.</p>
      <h2>How to ask</h2>
      <p>Email support@ghummakadsaathi.com with your account email and order date. Approved refunds go back to the original payment method through Dodo Payments.</p>
    </LegalPage>
  );
}
