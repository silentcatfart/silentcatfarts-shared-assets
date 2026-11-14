# silentcatfarts-shared-assets

Personal Foundry VTT module that provides game-specific compendiums of reusable assets for:

- Shadowdark
- Mothership
- Pirate Borg
- D&D 5e
- Old-School Essentials
- Dolmenwood

## Installation

In Foundry, go to **Add-on Modules → Install Module** and paste this manifest URL:

```
https://github.com/silentcatfart/silentcatfarts-shared-assets/releases/latest/download/module.json
```

## Requirements

Artwork and audio files must be installed to `/foundryuserdata/Data/artifacts`.
They are not included in this module because of licensing and copyright restrictions.

## Releases

Every push to `main` builds `module.zip` and publishes a GitHub release tagged with the `version` in `module.json`. Bump the version before pushing to cut a new release.

## Setting up a new Dolmenwood world

Needs the Dolmenwood system and the Dolmenwood Premium Game module.

1. Enable this module, the Premium Game and the modules the settings baseline covers (Augur Nexus and Augur
   Fantasy, Light Sources, Sandbox Settlement Manager, Always HP, Easy Token, Dice So Nice and so on).
2. Import the **Dolmenwood Nexus** compendium: Import All, with **Keep Document IDs** ticked and no target folder.
   The entries link to each other, to the connections database and to map pins by ID.
3. Run the **Apply World Settings** macro (Dolmenwood Macros), then reload. It sets the world to the baseline in
   `data/settings/dolmenwood.json`, including the Light Sources list and Augur's connections database. Run it after
   the Nexus import, so nothing overwrites the database setting afterwards.
4. Create the users. Players build characters with the Dolmenwood Player Macros: Roll Ability Scores, Roll
   Character Details, then Roll Starting Equipment (a GM must be online to hand out the starting kit).
