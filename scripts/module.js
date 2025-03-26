Hooks.on("ready", async () => {
  if (!game.user.isGM) return; // Only runs for GMs

  console.log("Updating compendium permissions for silentcatfarts-shared-assets...");

  // Define system-specific packs
  const systemPacks = {
    ose: ["ose-actors", "ose-items", "ose-adventures", "ose-tables", "ose-journals", "ose-macros", "ose-scenes"],
    dnd5e: ["dnd5e-actors", "dnd5e-items", "dnd5e-adventures", "dnd5e-tables", "dnd5e-journals", "dnd5e-macros", "dnd5e-scenes"],
    shadowdark: ["shadowdark-actors", "shadowdark-items", "shadowdark-adventures", "shadowdark-tables", "shadowdark-journals", "shadowdark-macros", "shadowdark-scenes"],
    "fantastic-depths": ["fade-actors", "fade-items", "fade-adventures", "fade-tables", "fade-journals", "fade-macros", "fade-scenes"]
  };

  const currentSystem = game.system.id; // Get active system ID
  console.log(`Detected system: ${currentSystem}`);

  // Get packs relevant to the current system
  let packNames = systemPacks[currentSystem] || [];

  // Always include "playlists"
  packNames.push("playlists");

  for (let packName of packNames) {
    let pack = game.packs.get(`silentcatfarts-shared-assets.${packName}`);
    if (!pack) {
      console.warn(`Compendium ${packName} not found for system ${currentSystem}!`);
      continue;
    }

    try {
      let contents = await pack.getDocuments();
      console.log(`Loaded ${contents.length} documents from ${packName}`);

      for (let doc of contents) {
        // Initialize the ownership field as an empty object
        let ownership = {};

        // Set ownership for default user (0 = NONE, no access for players)
        ownership["default"] = 0;

        // Loop through all users and explicitly set ownership
        game.users.forEach(user => {
          if (user.isGM) {
            ownership[user.id] = 4; // 4 = OWNER for the GM
          } else if (user.isPlayer) {
            ownership[user.id] = 0; // 0 = NONE for players
          }
        });

        // Update the document with the new ownership
        await doc.update({ ownership }, { recursive: true });
      }

      console.log(`Permissions updated for ${packName} in system ${currentSystem}`);
    } catch (error) {
      console.error(`Error updating permissions for ${packName}:`, error);
    }
  }

  console.log("Compendium permission updates complete.");
});