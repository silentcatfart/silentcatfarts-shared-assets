/**
 * Seeds the Light Sources module (light-sources) with this module's setup for the
 * world's game system. Runs once per world: only while the world has no light
 * sources yet, so anything the GM changes afterwards is left alone.
 *
 * The data files are Light Sources export files, so the same file also works with
 * Light Sources' own Settings > Import/Export.
 */
const MODULE_ID = "silentcatfarts-shared-assets";
const LIGHT_SOURCES = "light-sources";

/** Seed file per game system id, relative to this module's folder. */
const SEEDS = {
  dolmenwood: "data/light-sources/dolmenwood.json"
};

/** Light Sources settings outside the export format, set alongside the sources. */
const EXTRA_SETTINGS = {
  dolmenwood: { restrictPlayerControl: false, allowFreeForAllDrop: true, announceLit: true }
};

Hooks.once("ready", async () => {
  if ( !game.user.isActiveGM ) return;
  if ( !game.modules.get(LIGHT_SOURCES)?.active ) return;
  const file = SEEDS[game.system.id];
  if ( !file ) return;
  if ( game.settings.get(LIGHT_SOURCES, "gmSources")?.length ) return;

  try {
    const data = await foundry.utils.fetchJsonWithTimeout(`modules/${MODULE_ID}/${file}`);
    await game.settings.set(LIGHT_SOURCES, "gmSources", data.sources);
    const settings = { ...data.compatibility, ...EXTRA_SETTINGS[game.system.id] };
    for ( const [key, value] of Object.entries(settings) ) {
      await game.settings.set(LIGHT_SOURCES, key, value);
    }
    ui.notifications.info(`Silentcatfart's Shared Assets: added ${data.sources.length} light sources for ${game.system.title}.`);
  } catch(err) {
    console.error(`${MODULE_ID} | Could not seed Light Sources from ${file}.`, err);
    ui.notifications.warn("Silentcatfart's Shared Assets: could not set up Light Sources. See the console.");
  }
});
