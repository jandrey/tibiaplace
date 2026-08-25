import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { listingImages, listings } from "@/lib/db/schema";
import {
  deleteFromR2,
  MAX_IMAGE_SIZE,
  MAX_IMAGES_PER_LISTING,
  uploadToR2,
} from "@/lib/r2";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: listingId } = await params;

  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);

  if (!listing) {
    return NextResponse.json({ error: "Listing não encontrado" }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(listingImages)
    .where(eq(listingImages.listingId, listingId));

  if (existing.length >= MAX_IMAGES_PER_LISTING) {
    return NextResponse.json(
      { error: `Máximo de ${MAX_IMAGES_PER_LISTING} imagens por anúncio` },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "Imagem excede 5MB" },
      { status: 400 },
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Apenas imagens são permitidas" },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() ?? "jpg";
    const key = `listings/${listingId}/${nanoid()}.${ext}`;
    const url = await uploadToR2(key, buffer, file.type);

    const imageId = nanoid();
    await db.insert(listingImages).values({
      id: imageId,
      listingId,
      url,
      r2Key: key,
      sortOrder: existing.length,
    });

    return NextResponse.json({ id: imageId, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro no upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: listingId } = await params;
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");

  if (!imageId) {
    return NextResponse.json({ error: "imageId obrigatório" }, { status: 400 });
  }

  const [image] = await db
    .select()
    .from(listingImages)
    .where(eq(listingImages.id, imageId))
    .limit(1);

  if (!image || image.listingId !== listingId) {
    return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
  }

  await deleteFromR2(image.r2Key);
  await db.delete(listingImages).where(eq(listingImages.id, imageId));

  return NextResponse.json({ ok: true });
}
