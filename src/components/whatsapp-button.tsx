import { getWhatsAppNumber } from "@/lib/settings";
import {
  buildInterestMessage,
  getWhatsAppUrl,
} from "@/lib/utils";
import {
  listingPublicPath,
  type ListingType,
} from "@/lib/listings/types";
import { Button } from "@/components/ui";

export async function WhatsAppButton({
  listingTitle,
  listingSlug,
  listingType = "character",
}: {
  listingTitle: string;
  listingSlug: string;
  listingType?: ListingType | string;
}) {
  const phone = await getWhatsAppNumber();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const listingUrl = `${baseUrl}${listingPublicPath(listingType, listingSlug)}`;
  const message = buildInterestMessage(listingUrl, listingTitle, {
    listingType,
  });

  if (!phone) {
    return (
      <Button disabled className="w-full">
        WhatsApp não configurado
      </Button>
    );
  }

  return (
    <a
      href={getWhatsAppUrl(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full"
    >
      <Button className="w-full">Tenho interesse</Button>
    </a>
  );
}
