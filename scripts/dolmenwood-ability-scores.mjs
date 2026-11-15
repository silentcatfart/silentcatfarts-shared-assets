// Dolmenwood character creation cards (posted by the Roll Ability Scores and Roll Starting Equipment macros): the card's
// "Apply to Open Sheet" button writes its result to a character sheet the clicking user has open and owns: the six
// ability scores, or the starting items and gold. Only the player who rolled, or a GM, can apply. Starting items are
// handed out by a GM's client (see applyKit), so a GM must be online for that one.
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
    // also clear the system's "not yet set" marker (2.1.5+), or the sheet keeps showing its Roll / Enter buttons
    await actor.update({ ...Object.fromEntries(ABILITIES.map(k => [`system.abilities.${k}.score`, scores[k]])),
        "flags.dolmenwood.unsetAbilities": [] });
    ui.notifications.info(`Ability Scores set for ${actor.name}.`);
}

// Starting kits are applied by a GM's client: Player Items is GM-only (trinkets and cold iron aren't for browsing), so a
// player's client can't read it. Items are found by name in Player Items first (our trinkets), then the Dolmenwood
// Premium Game's Player's Book items and magic, ignoring case and punctuation.
const KIT_PACKS = [`${MODULE}.dolmenwood-player-items`, "dolmenwood-premiumgame.dpb-items", "dolmenwood-premiumgame.dpb-magic"];
const KIT_ALIASES = {
    "Oil (flask)": "Oil Flask", "Paper or parchment (2 sheets)": "Paper or Parchment (2)", "Chalk (10 sticks)": "Chalk",
    "Leather armour": "Leather", "Chainmail armour": "Chainmail", "Plate mail armour": "Plate Mail", "Bark armour": "Bark",
    "Pinecone armour": "Pinecone", "Arrows (quiver of 20)": "Arrow (20)", "Quarrels (case of 20)": "Quarrel (20)",
    "Sling stones": "Sling Stone", "Torches (3)": "Torch (3)", "Candles (10)": "Candle (10)"
};
const keyOf = name => name.toLowerCase().replace(/[^a-z0-9]/g, "");
let trinketMap = null;

async function kitIndex() {
    const index = new Map();
    for (const id of KIT_PACKS) {
        const pack = game.packs.get(id);
        if (!pack) continue;
        for (const e of await pack.getIndex()) if (!index.has(keyOf(e.name))) index.set(keyOf(e.name), e.uuid);
    }
    return index;
}

// Runs on a GM's client: builds the items and gold for actor from the card's names
async function buildAndApplyKit(actor, { gold, items, trinket }) {
    const index = await kitIndex();
    const data = [], missing = [];
    const add = async (uuid, { qty = 1, rename, notes } = {}) => {
        const item = await fromUuid(uuid);
        if (!item) return false;
        const d = item.toObject();
        delete d._id;
        d._stats = { ...d._stats, compendiumSource: uuid };
        if (qty > 1) d.system.quantity = (d.system.quantity || 1) * qty;
        // e.g. a magician's starting spell book: a blank spell book, named and noted with its spells
        if (rename) d.name = rename;
        if (notes) d.system.notes = notes;
        data.push(d);
        return true;
    };
    for (const spec of items) {
        const uuid = spec.uuid ?? index.get(keyOf(KIT_ALIASES[spec.name] ?? spec.name));
        if (!uuid || !(await add(uuid, spec))) missing.push(spec.name);
    }
    if (trinket) {
        trinketMap ??= await foundry.utils.fetchJsonWithTimeout(`modules/${MODULE}/data/dolmenwood-trinkets.json`).catch(() => ({}));
        const id = trinketMap[trinket];
        const uuid = id ? `Compendium.${MODULE}.dolmenwood-player-items.Item.${id}` : index.get(keyOf(trinket));
        if (!uuid || !(await add(uuid))) data.push({ name: trinket.length > 60 ? `${trinket.slice(0, 57)}…` : trinket, type: "Item",
            img: "icons/svg/item-bag.svg", system: { notes: `<p><strong>Trinket:</strong> ${trinket}</p>` } });
    }
    if (data.length) await actor.createEmbeddedDocuments("Item", data);
    await actor.update({ "system.coins.gold": gold });
    return { count: data.length, gold, missing };
}

const kitDone = (name, { count, gold, missing }) => {
    ui.notifications.info(`Starting equipment added to ${name}: ${count} items, ${gold} gp.`);
    if (missing.length) ui.notifications.warn(`Not found, add by hand: ${missing.join(", ")}`, { permanent: true });
};

async function applyKit(message) {
    const kit = message.getFlag(MODULE, "startingKit");
    const actor = await pickSheet(message, `this starting equipment (${kit.gold} gp${kit.items.length ? `, ${kit.items.length} items` : ""})`);
    if (!actor) return;
    if (game.user.isGM) return kitDone(actor.name, await buildAndApplyKit(actor, kit));
    if (!game.users.activeGM) return ui.notifications.warn("A GM needs to be online to hand out starting equipment. Try again when one is.");
    game.socket.emit(`module.${MODULE}`, { type: "applyKit", userId: game.user.id, actorUuid: actor.uuid, kit });
    ui.notifications.info(`Starting equipment sent to the GM for ${actor.name}…`);
}

function onSocket(data) {
    if (data?.type === "applyKit" && game.users.activeGM?.isSelf) {
        (async () => {
            const actor = await fromUuid(data.actorUuid);
            if (!actor) return;
            const result = await buildAndApplyKit(actor, data.kit);
            game.socket.emit(`module.${MODULE}`, { type: "applyKitDone", userId: data.userId, name: actor.name, result });
        })().catch(err => console.error(`${MODULE} | starting kit`, err));
    }
    if (data?.type === "applyKitDone" && data.userId === game.user.id) kitDone(data.name, data.result);
}

// One listener for the whole page (capture phase, so it runs before the chat log's own action handling): works for
// cards in the chat log, popped-out chat and chat notifications, without depending on when a message was rendered.
const ACTIONS = { applyAbilityScores: ["abilityScores", applyScores], applyStartingKit: ["startingKit", applyKit] };
Hooks.once("ready", () => {
    if (game.system.id !== "dolmenwood") return;
    game.socket.on(`module.${MODULE}`, onSocket);
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
