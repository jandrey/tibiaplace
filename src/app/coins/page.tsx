export const dynamic = "force-dynamic";

import { CoinsShopPanel } from "@/components/coins-shop-panel";
import { SectionShell } from "@/components/section-shell";
import { getCoinsShopConfig } from "@/lib/settings/coins-shop";
import { getWhatsAppNumber } from "@/lib/settings";

export default async function CoinsShopPage() {
  const [config, whatsappPhone] = await Promise.all([
    getCoinsShopConfig(),
    getWhatsAppNumber(),
  ]);

  return (
    <SectionShell active="rubini_coins">
      <CoinsShopPanel config={config} whatsappPhone={whatsappPhone} />
    </SectionShell>
  );
}
