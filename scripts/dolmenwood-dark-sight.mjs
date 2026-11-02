// Dolmenwood Dark Sight (from the "Dark Sight (1 day)" player macro): when the character's Dark Sight Effect is removed —
// the system deletes it once game time passes its 1-day duration, or someone deletes it — their tokens get their
// previous vision back. Runs on the active GM's client.
const MODULE = "silentcatfarts-shared-assets";

// The actor's default token and its linked tokens on every scene
const tokensOf = actor => game.scenes.contents.flatMap(s => s.tokens.filter(t => t.actorLink && t.actorId === actor.id));

Hooks.on("deleteItem", async item => {
    if (game.system.id !== "dolmenwood" || !game.users.activeGM?.isSelf) return;
    const previous = item.getFlag(MODULE, "darkSight");
    const actor = item.parent;
    if (!previous || !(actor instanceof Actor)) return;
    await actor.update({ "prototypeToken.sight": previous });
    for (const token of tokensOf(actor)) await token.update({ sight: previous });
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id), content: `<p><strong>${actor.name}</strong>: Dark Sight has worn off.</p>` });
});
