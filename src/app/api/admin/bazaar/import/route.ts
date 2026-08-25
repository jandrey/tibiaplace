import { z } from "zod";
import { db } from "@/lib/db";
import {
  ensureUniqueSlug,
  importBazaarToListing,
} from "@/lib/bazaar/importer";
import {
  encodeImportEvent,
  type ImportProgressReporter,
} from "@/lib/bazaar/import-progress";
import { fetchBazaarData } from "@/lib/bazaar/rubinot-fetch";
import { assertBazaarData, parseBazaarUrl } from "@/lib/bazaar/types";
import { requireAdminSession } from "@/lib/auth/session";
import { listings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const bodySchema = z.object({
  bazaarUrl: z.string().url(),
  bazaarData: z.unknown().optional(),
});

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return new Response(JSON.stringify({ step: "error", error: "Não autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const emit: ImportProgressReporter = (event) => {
        controller.enqueue(encodeImportEvent(event));
      };

      try {
        const body = bodySchema.parse(await request.json());

        emit({
          step: "validate",
          label: "Validando URL do bazaar",
          progress: 4,
        });

        const bazaarId = parseBazaarUrl(body.bazaarUrl);
        if (!bazaarId) {
          controller.enqueue(
            encodeImportEvent({
              step: "error",
              error: "URL inválida. Use rubinot.com.br/bazaar/{id}",
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

        const data = body.bazaarData
          ? (() => {
              assertBazaarData(body.bazaarData);
              if (body.bazaarData.auction.id !== bazaarId) {
                throw new Error(
                  "O JSON colado não corresponde ao ID da URL do bazaar",
                );
              }
              return body.bazaarData;
            })()
          : await fetchBazaarData(bazaarId);

        emit({
          step: "fetch",
          label: `Personagem: ${data.player.name}`,
          detail: `Level ${data.player.level} · ${data.player.vocationName}`,
          progress: 22,
        });

        emit({
          step: "slug",
          label: "Gerando URL pública",
          progress: 24,
        });

        const baseSlug = `${data.player.vocationName}-${data.player.level}-${data.player.worldName}`
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        const slug = await ensureUniqueSlug(baseSlug);

        const listingId = await importBazaarToListing(
          session.user.id,
          body.bazaarUrl,
          data,
          emit,
        );

        emit({
          step: "slug",
          label: "Finalizando slug",
          progress: 94,
        });

        await db.update(listings).set({ slug }).where(eq(listings.id, listingId));

        controller.enqueue(
          encodeImportEvent({
            step: "done",
            label: "Importação concluída",
            progress: 100,
            listingId,
            slug,
          }),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao importar bazaar";
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
