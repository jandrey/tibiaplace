import { eq } from "drizzle-orm";
import { syncListingFromBazaar } from "@/lib/bazaar/importer";
import {
  encodeImportEvent,
  type ImportProgressReporter,
} from "@/lib/bazaar/import-progress";
import { fetchBazaarData } from "@/lib/bazaar/rubinot-fetch";
import { parseBazaarUrl } from "@/lib/bazaar/types";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return new Response(JSON.stringify({ step: "error", error: "Não autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }

  const { id } = await params;

  const stream = new ReadableStream({
    async start(controller) {
      const emit: ImportProgressReporter = (event) => {
        controller.enqueue(encodeImportEvent(event));
      };

      try {
        const [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, id))
          .limit(1);

        if (!listing?.bazaarUrl) {
          controller.enqueue(
            encodeImportEvent({
              step: "error",
              error: "Anúncio sem URL do bazaar",
            }),
          );
          controller.close();
          return;
        }

        emit({
          step: "validate",
          label: "Validando URL do bazaar",
          progress: 4,
        });

        const bazaarId = parseBazaarUrl(listing.bazaarUrl);
        if (!bazaarId) {
          controller.enqueue(
            encodeImportEvent({
              step: "error",
              error: "URL do bazaar inválida",
            }),
          );
          controller.close();
          return;
        }

        emit({
          step: "fetch",
          label: "Baixando dados do RubinOT",
          progress: 8,
        });

        const data = await fetchBazaarData(bazaarId);

        emit({
          step: "fetch",
          label: `Sincronizando ${data.player.name}`,
          detail: `Level ${data.player.level} · ${data.player.vocationName}`,
          progress: 22,
        });

        await syncListingFromBazaar(id, listing.bazaarUrl, data, {
          slug: listing.slug,
          title: listing.title,
          description: listing.description,
          priceBrl: listing.priceBrl,
          priceCoins: listing.priceCoins,
          privacyToggles: listing.privacyToggles,
          featured: listing.featured,
          status: listing.status,
        }, emit);

        controller.enqueue(
          encodeImportEvent({
            step: "done",
            label: "Sincronização concluída",
            progress: 100,
            listingId: id,
            slug: listing.slug,
          }),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao sincronizar";
        controller.enqueue(encodeImportEvent({ step: "error", error: message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
