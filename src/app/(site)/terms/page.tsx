import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <LegalPage title="Terms of use" updated="29 October 2026">
      <p>These terms explain what Ghummakad Saathi provides when you use the website, explore the community map or buy a trip plan.</p>
      <h2>What we provide</h2>
      <ul>
        <li>A free planner that suggests destinations from your answers, and a free community map for signed-in members.</li>
        <li>A paid trip plan: one editable trip workspace with a generated itinerary, unlimited edits for 30 days from confirmed payment.</li>
        <li>Links to third-party providers (for example Booking.com, KAYAK, Skyscanner, IRCTC). Bookings are contracts between you and that provider.</li>
      </ul>
      <h2>Prices and estimates</h2>
      <p>Trip plans cost ₹499 for 1–4 travellers or ₹999 for 5+ travellers, inclusive of applicable taxes. Budgets, travel times and costs in plans are illustrative estimates, not quotes. We don&rsquo;t guarantee availability, prices, opening hours or road conditions — always check with the provider.</p>
      <h2>Your 30-day editing window</h2>
      <p>The window starts at the moment your payment is confirmed and ends exactly 30 days (720 hours) later. During it you can change anything in that trip, including the destination. One payment covers one trip workspace. After the window, the plan remains viewable. Reasonable automated limits may slow very rapid AI requests to protect the service; they never cap the number of edits you can make in the window.</p>
      <h2>Community content</h2>
      <p>You keep ownership of what you post and give us a licence to display it on the service. You must follow the <a href="/community-guidelines" className="underline">community guidelines</a>. We may hide or remove content that breaks them.</p>
      <h2>Acceptable use</h2>
      <ul>
        <li>No scraping, automated account creation, fake reviews, or attempts to bypass security or payment checks.</li>
        <li>No posting other people&rsquo;s private information.</li>
      </ul>
      <h2>Liability</h2>
      <p>Travel involves risk. Use your own judgement about safety, weather, permits and health. To the extent permitted by law, our liability is limited to the amount you paid for the affected trip plan.</p>
      <h2>Contact</h2>
      <p>Questions: hello@ghummakadsaathi.com</p>
    </LegalPage>
  );
}
