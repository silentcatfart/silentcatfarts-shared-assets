Hooks.on("ready", async () => {
  if (!game.user.isGM) return; // Only let the GM set permissions

  const packNames = ["actors", "items", "adventures", "tables", "journals", "macros", "scenes"];

  for (let packName of packNames) {
    let pack = game.packs.get(`silentcatfarts-shared-assets.${packName}`);
    if (!pack) continue;

    let contents = await pack.getDocuments();
    for (let doc of contents) {
      let updateData = {
        ownership: {
          default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,
          player: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE
        }
      };
      await doc.update(updateData, { recursive: true });
    }
    console.log(`Updated permissions for ${packName}`);
  }
});

