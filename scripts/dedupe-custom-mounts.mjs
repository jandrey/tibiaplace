import { neon } from "@neondatabase/serverless";

/**
 * Remove vanilla catalog_mounts that duplicate custom RubinOT mounts (id >= 90000).
 * Remaps listing_mounts to the custom id before delete.
 */
async function dedupeCustomMountCatalog(sql) {
  const pairs = await sql`
    SELECT vanilla.id AS vanilla_id, custom.id AS custom_id, custom.name
    FROM catalog_mounts vanilla
    JOIN catalog_mounts custom
      ON lower(trim(vanilla.name)) = lower(trim(custom.name))
     AND custom.id >= 90000
    WHERE vanilla.id < 90000
  `;

  for (const row of pairs) {
    const { vanilla_id: vanillaId, custom_id: customId, name } = row;

    await sql`
      UPDATE listing_mounts
      SET mount_id = ${customId}
      WHERE mount_id = ${vanillaId}
    `;
    await sql`DELETE FROM catalog_mounts WHERE id = ${vanillaId}`;
    console.log(`deduped mount "${name}": ${vanillaId} → ${customId}`);
  }

  return pairs.length;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");

  const sql = neon(url);
  const removed = await dedupeCustomMountCatalog(sql);
  console.log(`Removed ${removed} duplicate vanilla mount(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
