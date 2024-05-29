import { rollAttr, rollItem } from "../util/dice.js";

const attr_imgs = {
    //Physical
    "agility": "systems/openlegend/icons/blackbackground/body-balance.svg",
    "fortitude": "systems/openlegend/icons/blackbackground/health-normal.svg",
    "might": "systems/openlegend/icons/blackbackground/mighty-force.svg",
    //Mental
    "learning": "systems/openlegend/icons/blackbackground/archive-research.svg",
    "logic": "systems/openlegend/icons/blackbackground/logic-gate-xor.svg",
    "perception": "systems/openlegend/icons/blackbackground/semi-closed-eye.svg",
    "will": "systems/openlegend/icons/blackbackground/brain.svg",
    //Social
    "deception": "systems/openlegend/icons/blackbackground/diamonds-smile.svg",
    "persuasion": "systems/openlegend/icons/blackbackground/convince.svg",
    "presence": "systems/openlegend/icons/blackbackground/public-speaker.svg",
    //Extraordinary
    "alteration": "systems/openlegend/icons/blackbackground/card-exchange.svg",
    "creation": "systems/openlegend/icons/blackbackground/anvil-impact.svg",
    "energy": "systems/openlegend/icons/blackbackground/rolling-energy.svg",
    "entropy": "systems/openlegend/icons/blackbackground/poison.svg",
    "influence": "systems/openlegend/icons/blackbackground/retro-controller.svg",
    "movement": "systems/openlegend/icons/blackbackground/move.svg",
    "prescience": "systems/openlegend/icons/blackbackground/crystal-ball.svg",
    "protection": "systems/openlegend/icons/blackbackground/protection-glasses.svg"
};

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */
export async function createOLMacro(data, slot) {
    if (data.macro === 'attr') {
        const command = `game.openlegend.macros.rollAttrMacro("${data.actor}", "${data.attr}")`;
        let macro = game.macros.contents.find(m => m.command === command);
        if (!macro) {
            macro = await Macro.create({
                name: _capitalize(data.attr),
                type: "script",
                img: attr_imgs[data.attr],
                command: command
            });
        }
        game.user.assignHotbarMacro(macro, slot);
    } else if (data.macro === 'item') {
        const command = `game.openlegend.macros.rollItemMacro("${data.actor}", "${data.item}")`;
        let macro = game.macros.contents.find(m => m.command === command);
        if (!macro) {
            const actor = await fromUuid(data.actor);
            const item = actor.items.get(data.item);
            macro = await Macro.create({
                name: data.name,
                type: "script",
                img: item.img,
                command: command
            });
        }
        game.user.assignHotbarMacro(macro, slot);
    }
    return false;
}

/* -------------------------------------------- */
export async function rollAttrMacro(actor_id, attr_name) {
    const actor = await fromUuid(actor_id);
    rollAttr(actor, attr_name);
}

export async function rollItemMacro(actor_id, item_id) {
    const actor = await fromUuid(actor_id);
    const item = actor.items.get(item_id);
    rollItem(actor, item);
}

function _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}