import { rollAttr, rollItem } from "../util/dice.js";

const attr_imgs = {
    //Physical
    "agility": "Modules/Game-Icons-Net/Blackbackground/Body-Balance.Svg",
    "fortitude": "Modules/Game-Icons-Net/Blackbackground/Health-Normal.Svg",
    "might": "Modules/Game-Icons-Net/Blackbackground/Mighty-Force.Svg",
    //Mental
    "learning": "Modules/Game-Icons-Net/Blackbackground/Archive-Research.Svg",
    "logic": "Modules/Game-Icons-Net/Blackbackground/Logic-Gate-Xor.Svg",
    "perception": "Modules/Game-Icons-Net/Blackbackground/Semi-Closed-Eye.Svg",
    "will": "Modules/Game-Icons-Net/Blackbackground/Brain.Svg",
    //Social
    "deception": "Modules/Game-Icons-Net/Blackbackground/Diamonds-Smile.Svg",
    "persuasion": "Modules/Game-Icons-Net/Blackbackground/Convince.Svg",
    "presence": "Modules/Game-Icons-Net/Blackbackground/Public-Speaker.Svg",
    //Extraordinary
    "alteration": "Modules/Game-Icons-Net/Blackbackground/Card-Exchange.Svg",
    "creation": "Modules/Game-Icons-Net/Blackbackground/Anvil-Impact.Svg",
    "energy": "Modules/Game-Icons-Net/Blackbackground/Rolling-Energy.Svg",
    "entropy": "Modules/Game-Icons-Net/Blackbackground/Poison.Svg",
    "influence": "Modules/Game-Icons-Net/Blackbackground/Retro-Controller.Svg",
    "movement": "Modules/Game-Icons-Net/Blackbackground/Move.Svg",
    "prescience": "Modules/Game-Icons-Net/Blackbackground/Crystal-Ball.Svg",
    "protection": "Modules/Game-Icons-Net/Blackbackground/Protection-Glasses.Svg"
};

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */
export async function createOLMacro(data, slot) {
    if (data.macro == 'attr') {
        const command = `game.openlegend.macros.rollAttrMacro("${data.actor}", "${data.attr}")`;
        let macro = game.macros.entities.find(m => m.data.command === command);
        if (!macro) {
            macro = await Macro.create({
                name: _capitalize(data.attr),
                type: "script",
                img: attr_imgs[data.attr],
                command: command
            });
        }
        game.user.assignHotbarMacro(macro, slot);
    } else if (data.macro == 'item') {
        const command = `game.openlegend.macros.rollItemMacro("${data.actor}", "${data.item}")`;
        let macro = game.macros.entities.find(m => m.command === command);
        if (!macro) {
            const actor = game.actors.get(data.actor);
            const item = actor.getOwnedItem(data.item).data;
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
    const actor = game.actors.get(actor_id);
    rollAttr(actor, attr_name);
}

export function rollItemMacro(actor_id, item_id) {
    const actor = game.actors.get(actor_id);
    const item = actor.getOwnedItem(item_id).data;
    rollItem(actor, item);
}

function _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}