import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Sponsored disclosure" };

export default function SponsoredDisclosure() {
  return (
    <LegalPage title="How sponsored placements work" updated="29 October 2026">
      <p>Ghummakad Saathi earns money from trip plans and from clearly labelled sponsored placements. Here&rsquo;s exactly how ads work.</p>
      <h2>What you&rsquo;ll see</h2>
      <ul>
        <li>Every paid placement carries a visible &ldquo;Sponsored&rdquo; label, the advertiser&rsquo;s name, and why it&rsquo;s shown.</li>
        <li>Ads appear in their own separate spaces — never mixed into your destination matches, your itinerary or community reviews.</li>
        <li>No ads appear in the trip questions or during payment.</li>
      </ul>
      <h2>What sponsors can&rsquo;t do</h2>
      <ul>
        <li>Pay to change which destinations we recommend or in what order.</li>
        <li>Buy, edit or hide reviews and ratings.</li>
        <li>Appear as an organic or &ldquo;best&rdquo; recommendation.</li>
      </ul>
      <h2>How sponsors pay</h2>
      <p>Sponsors pay per valid click. We filter automated traffic, count repeat clicks from the same visitor once, stop campaigns when their budget runs out, and review disputed clicks.</p>
      <h2>Affiliate links</h2>
      <p>Some partner links (such as hotel or flight searches) may earn us a commission once a partner programme approves us. These links are marked as affiliate links. Prices on the partner&rsquo;s site are the same either way.</p>
    </LegalPage>
  );
}
