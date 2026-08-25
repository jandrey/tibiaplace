import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/session";
import { getWhatsAppNumber, setSetting } from "@/lib/settings";
import {
  COINS_LOT_SIZE,
  getCoinsShopConfig,
  hasValidCoinsShopBasePrice,
  normalizePriceTiers,
  setCoinsShopConfig,
  type CoinsShopConfig,
} from "@/lib/settings/coins-shop";

const priceTierSchema = z.object({
  minQuantity: z.number().int().min(COINS_LOT_SIZE),
  pricePerLotBrl: z.string(),
});

const coinsShopSchema = z.object({
  enabled: z.boolean(),
  title: z.string().min(1),
  description: z.string(),
  stockAvailable: z.number().int().min(0),
  priceTiers: z.array(priceTierSchema).min(1),
});

const schema = z.object({
  whatsappNumber: z.string().min(8),
  coinsShop: coinsShopSchema.optional(),
});

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [whatsappNumber, coinsShop] = await Promise.all([
    getWhatsAppNumber(),
    getCoinsShopConfig(),
  ]);
  return NextResponse.json({ whatsappNumber, coinsShop });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    await setSetting("whatsapp_number", body.whatsappNumber);
    if (body.coinsShop) {
      const config: CoinsShopConfig = {
        ...body.coinsShop,
        priceTiers: normalizePriceTiers(body.coinsShop.priceTiers),
      };
      if (config.enabled && !hasValidCoinsShopBasePrice(config)) {
        return NextResponse.json(
          {
            error:
              "Defina o preço base por 25 coins antes de ativar a loja.",
          },
          { status: 400 },
        );
      }
      await setCoinsShopConfig(config);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}
