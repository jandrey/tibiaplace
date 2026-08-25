import { getWhatsAppNumber } from "@/lib/settings";
import {
  buildInterestMessage,
  getWhatsAppUrl,
} from "@/lib/utils";
import {
  listingPublicPath,
  type ListingType,
} from "@/lib/listings/types";
import { InterestButton } from "@/components/interest-button";

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
      <InterestButton disabled className="w-full">
        WhatsApp não configurado
      </InterestButton>
    );
  }

  return (
    <InterestButton
      href={getWhatsAppUrl(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full"
    >
      Tenho interesse
    </InterestButton>
  );
}
