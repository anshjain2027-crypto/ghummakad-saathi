import type { ReactNode } from "react";
import { Container } from "./ui";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <Container narrow className="py-12 sm:py-16">
      <p className="mb-6 rounded-[12px] border border-sand bg-sand-soft px-4 py-3 text-[14px]">
        Draft for legal review. This page is a plain-language starting point and must be reviewed by a qualified lawyer (including India&rsquo;s DPDP Act 2023 obligations) before launch.
      </p>
      <h1 className="text-[42px]">{title}</h1>
      <p className="mt-2 text-[14px] text-ink-soft">Last updated {updated}</p>
      <div className="legal mt-8 space-y-5 text-[16px] leading-relaxed [&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-[26px] [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
    </Container>
  );
}
