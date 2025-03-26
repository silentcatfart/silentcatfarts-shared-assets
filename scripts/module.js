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
        // Start by setting the default ownership to NONE
        let updateData = {
          ownership: {
            "default": 0 // 0 = NONE (no access for players)
          }
        };

        // Explicitly set each user's permission level (you can adjust as needed)
        game.users.forEach(user => {
          // If the user is a player, give them NONE access (no access)
          if (user.isPlayer) {
            updateData.ownership[user.id] = 0; // 0 = NONE
          }
          // If the user is the GM, you can provide full access
          else if (user.isGM) {
            updateData.ownership[user.id] = 4; // 4 = OWNER
          }
        });

        // Apply the ownership changes
        await doc.update(updateData, { recursive: true });
      }
      console.log(`Permissions updated for ${packName} in system ${currentSystem}`);
    } catch (error) {
      console.error(`Error updating permissions for ${packName}:`, error);
    }
  }

  console.log("Compendium permission updates complete.");
});