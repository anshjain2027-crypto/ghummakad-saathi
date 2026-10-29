import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="29 October 2026">
      <p>We collect as little as we can to run the service, and we never sell your personal data.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account: your email address and the display name you choose.</li>
        <li>Planning: your trip answers (mood, companions, style, departure city, dates, budget, notes) and the plans we generate.</li>
        <li>Community: places you save privately, places you submit, reviews and reports.</li>
        <li>Payments: order status and amounts. Card and bank details are handled by Dodo Payments; we never see or store them.</li>
        <li>Technical: a random visitor cookie used to count ad clicks fairly and prevent abuse, and basic logs.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To build and save your trip, show your map pins and reviews, and process payments.</li>
        <li>To keep the community genuine (moderation, spam and fraud prevention).</li>
        <li>With your consent only: occasional trip-idea emails.</li>
      </ul>
      <h2>Who we share it with</h2>
      <ul>
        <li>Service providers who run parts of the service for us: hosting (Vercel), database and sign-in (Supabase), payments (Dodo Payments), maps (Google Maps Platform), AI text generation (our configured LLM provider) and web search (Exa). Trip answers sent to the AI provider exclude your email.</li>
        <li>When you click through to a booking partner, that partner receives the search details in the link (for example destination and dates).</li>
      </ul>
      <h2>Private pins</h2>
      <p>Private saved places are protected by database-level access rules so only your account can read them.</p>
      <h2>Your rights</h2>
      <p>You can download your data from your profile, correct it, or ask us to delete your account. Some payment records may be kept where the law requires. Contact privacy@ghummakadsaathi.com.</p>
      <h2>Retention</h2>
      <p>Unpaid drafts expire after 7 days. Paid trips are kept while your account exists.</p>
    </LegalPage>
  );
}
