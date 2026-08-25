import { eq } from "drizzle-orm";
import { z } from "zod";
import { mergeListingFromBazaar } from "@/lib/bazaar/importer";
import {
  encodeImportEvent,
  type ImportProgressReporter,
} from "@/lib/bazaar/import-progress";
import { assertBazaarData } from "@/lib/bazaar/types";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";

const bodySchema = z.object({
  bazaarUrl: z.string().url(),
  bazaarData: z.unknown(),
});

export async function POST(
  request: Request,
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
        const body = bodySchema.parse(await request.json());
        assertBazaarData(body.bazaarData);
        const data = body.bazaarData;

        const [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, id))
          .limit(1);

        if (!listing) {
          controller.enqueue(
            encodeImportEvent({ step: "error", error: "Anúncio não encontrado" }),
          );
          controller.close();
          return;
        }

        if (listing.type !== "character") {
          controller.enqueue(
            encodeImportEvent({
              step: "error",
              error: "Importação JSON disponível apenas para personagens",
            }),
          );
          controller.close();
          return;
        }

        emit({
          step: "validate",
          label: "Validando JSON do bazaar",
          progress: 4,
        });

        if (listing.bazaarId && listing.bazaarId !== data.auction.id) {
          controller.enqueue(
            encodeImportEvent({
              step: "error",
              error: `Este anúncio é do bazaar #${listing.bazaarId}, mas o JSON é do #${data.auction.id}.`,
            }),
          );
          controller.close();
          return;
        }

        emit({
          step: "fetch",
          label: `Mesclando ${data.player.name}`,
          detail: `Level ${data.player.level} · ${data.player.vocationName}`,
          progress: 22,
        });

        await mergeListingFromBazaar(
          id,
          body.bazaarUrl,
          data,
          {
            slug: listing.slug,
            title: listing.title,
            description: listing.description,
            priceBrl: listing.priceBrl,
            priceCoins: listing.priceCoins,
            privacyToggles: listing.privacyToggles,
            featured: listing.featured,
            status: listing.status,
          },
          emit,
        );

        controller.enqueue(
          encodeImportEvent({
            step: "done",
            label: "Importação concluída",
            progress: 100,
            listingId: id,
            slug: listing.slug,
          }),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao importar JSON";
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
