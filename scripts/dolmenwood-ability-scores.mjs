// Dolmenwood character creation cards (posted by the Roll Ability Scores and Roll Starting Equipment macros): the card's
// "Apply to Open Sheet" button writes its result to a character sheet the clicking user has open and owns: the six
// ability scores, or the starting items and gold. Only the player who rolled, or a GM, can apply.
const MODULE = "silentcatfarts-shared-assets";
const ABILITIES = ["strength", "intelligence", "wisdom", "dexterity", "constitution", "charisma"];

// Open Adventurer sheets this user owns
const openSheets = () => [...foundry.applications.instances.values()]
    .map(app => app.document)
    .filter(doc => doc?.documentName === "Actor" && doc.type === "Adventurer" && doc.isOwner && doc.sheet?.rendered)
    .filter((doc, i, all) => all.indexOf(doc) === i);

// The open sheet to apply to (asks when several are open), after confirming
async function pickSheet(message, what) {
    if (message.author?.id !== game.user.id && !game.user.isGM) return ui.notifications.warn("Only the player who rolled this can apply it.");
    const sheets = openSheets();
    if (!sheets.length) return ui.notifications.warn("Open your character's sheet first, then click Apply.");
    if (sheets.length > 1) {
        const id = await foundry.applications.api.DialogV2.prompt({
            window: { title: "Apply to Sheet" },
            content: `<p>Apply ${what} to which character?</p><select name="actor">${sheets.map(a => `<option value="${a.id}">${a.name}</option>`).join("")}</select>`,
            ok: { label: "Apply", callback: (event, button) => button.form.elements.actor.value }
        });
        return sheets.find(a => a.id === id);
    }
    const ok = await foundry.applications.api.DialogV2.confirm({
        window: { title: "Apply to Sheet" },
        content: `<p>Apply ${what} to <strong>${sheets[0].name}</strong>?</p>`
    });
    return ok ? sheets[0] : null;
}

async function applyScores(message) {
    const scores = message.getFlag(MODULE, "abilityScores");
    const actor = await pickSheet(message, "these Ability Scores (current scores are replaced)");
    if (!actor) return;
    await actor.update(Object.fromEntries(ABILITIES.map(k => [`system.abilities.${k}.score`, scores[k]])));
    ui.notifications.info(`Ability Scores set for ${actor.name}.`);
}

async function applyKit(message) {
    const { gold, items, trinket } = message.getFlag(MODULE, "startingKit");
    const actor = await pickSheet(message, `this starting equipment (${gold} gp${items.length ? `, ${items.length} items` : ""})`);
    if (!actor) return;
    const data = [];
    for (const { uuid, qty, rename, notes } of items) {
        const item = await fromUuid(uuid);
        if (!item) continue;
        const d = item.toObject();
        delete d._id;
        d._stats = { ...d._stats, compendiumSource: uuid };
        if (qty > 1) d.system.quantity = (d.system.quantity || 1) * qty;
        // e.g. a magician's starting spell book: a blank spell book, named and noted with its spells
        if (rename) d.name = rename;
        if (notes) d.system.notes = notes;
        data.push(d);
    }
    if (trinket) data.push({ name: trinket.length > 60 ? `${trinket.slice(0, 57)}…` : trinket, type: "Item", img: "icons/svg/item-bag.svg",
        system: { notes: `<p><strong>Trinket:</strong> ${trinket}</p>` } });
    if (data.length) await actor.createEmbeddedDocuments("Item", data);
    await actor.update({ "system.coins.gold": gold });
    ui.notifications.info(`Starting equipment added to ${actor.name}: ${data.length} items, ${gold} gp.`);
}

// One listener for the whole page (capture phase, so it runs before the chat log's own action handling): works for
// cards in the chat log, popped-out chat and chat notifications, without depending on when a message was rendered.
const ACTIONS = { applyAbilityScores: ["abilityScores", applyScores], applyStartingKit: ["startingKit", applyKit] };
Hooks.once("ready", () => {
    if (game.system.id !== "dolmenwood") return;
    document.addEventListener("click", async event => {
        const button = event.target.closest?.(Object.keys(ACTIONS).map(a => `[data-action='${a}']`).join(","));
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        const [flag, fn] = ACTIONS[button.dataset.action];
        const message = game.messages.get(button.closest("[data-message-id]")?.dataset.messageId);
        if (!message?.getFlag(MODULE, flag)) return ui.notifications.warn("This card has nothing to apply (roll again with the current macro).");
        try { await fn(message); }
        catch (err) {
            console.error(`${MODULE} | character card`, err);
            ui.notifications.error(`Apply failed: ${err.message}`);
        }
    }, true);
    console.log(`${MODULE} | Dolmenwood character cards ready`);
});
