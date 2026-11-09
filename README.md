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

Artwork and audio files must be installed to these folders:

- `/foundryuserdata/Data/age-shared`
- `/foundryuserdata/Data/artifacts`

They are not included in this module because of licensing and copyright restrictions.

## Releases

Every push to `main` builds `module.zip` and publishes a GitHub release tagged with the `version` in `module.json`. Bump the version before pushing to cut a new release.
