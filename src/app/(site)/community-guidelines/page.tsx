import type { Metadata } from "next";
import { LegalPage } from "@/components/legal";

export const metadata: Metadata = { title: "Community guidelines" };

export default function Guidelines() {
  return (
    <LegalPage title="Community guidelines" updated="29 October 2026">
      <p>The map is only useful if it&rsquo;s honest. These rules keep it that way.</p>
      <h2>Do</h2>
      <ul>
        <li>Share places you&rsquo;ve actually been, and say honestly whether they&rsquo;re worth going.</li>
        <li>Include useful details: best time, how to get there, anything to watch out for.</li>
        <li>Respect local communities, private land and sacred sites.</li>
      </ul>
      <h2>Don&rsquo;t</h2>
      <ul>
        <li>Promote your own business, post phone numbers or links, or offer discounts.</li>
        <li>Post fake reviews, or reviews in exchange for payment or freebies.</li>
        <li>Share someone&rsquo;s home, private details or photos without consent.</li>
        <li>Post hateful, harassing or unsafe content (for example encouraging dangerous stunts).</li>
      </ul>
      <h2>Moderation</h2>
      <p>New public places are reviewed before they appear. Anyone signed in can report a place or review. Moderators may hide content that breaks these rules; if your submission is declined you&rsquo;ll see the reason and can edit and resubmit.</p>
      <h2>Not Google reviews</h2>
      <p>Explorer reviews are written by Ghummakad Saathi members and stored on our site. They are not posted to Google Maps.</p>
    </LegalPage>
  );
}
