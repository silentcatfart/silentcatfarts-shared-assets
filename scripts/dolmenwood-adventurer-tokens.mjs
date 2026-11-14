// Dolmenwood player characters' tokens: a new Adventurer actor's prototype token gets vision (Basic Vision, so it sees
// lit areas in line of sight), a Friendly disposition and its name shown to everyone. The system already makes it a
// linked token with an HP bar and a token ring. Only fills in what the new actor's data doesn't already set, so actors
// imported with their own token settings keep them. Monsters (Creature actors) are left alone.
const PLAYER_TOKEN = {
    "prototypeToken.sight.enabled": true,
    "prototypeToken.sight.visionMode": "basic",
    "prototypeToken.disposition": CONST.TOKEN_DISPOSITIONS.FRIENDLY,
    "prototypeToken.displayName": CONST.TOKEN_DISPLAY_MODES.ALWAYS
};

Hooks.on("preCreateActor", (actor, data, options, userId) => {
    if (game.system.id !== "dolmenwood" || actor.type !== "Adventurer" || userId !== game.user.id) return;
    const missing = Object.fromEntries(Object.entries(PLAYER_TOKEN).filter(([path]) => !foundry.utils.hasProperty(data, path)));
    if (Object.keys(missing).length) actor.updateSource(missing);
});
