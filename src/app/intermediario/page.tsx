export const dynamic = "force-dynamic";

import { IntermediarioPanel } from "@/components/intermediario-panel";
import { SectionShell } from "@/components/section-shell";
import { getWhatsAppNumber } from "@/lib/settings";

export default async function IntermediarioPage() {
  const whatsappPhone = await getWhatsAppNumber();

  return (
    <SectionShell active="intermediario">
      <IntermediarioPanel whatsappPhone={whatsappPhone} />
    </SectionShell>
  );
}
