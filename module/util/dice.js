
export async function rollAttr(actor, attr_name) {
    // Get the attribute from its name
    const attr = _getAttr(actor, attr_name);
    if (attr) {
        // Generate an OLRoll for the attribute
        let olroll = await OLRoll(attr_name, attr);
        if (olroll.roll) {
            // Generate a chat message template using OLRoll data
            const template = "systems/openlegends/templates/dialog/roll-chat.html";
            const data = {
                "name": attr_name,
                "type": 'Attribute',
                "attr": olroll.attr,
                "adv": olroll.adv
            }
            const html = await renderTemplate(template, data);
            // Roll the roll
            olroll.roll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: html
            });
        }
    }
}

export async function rollItem(actor, item) {
    // If the item has a chosen action attribute...
    const attr_name = item.data.action.attribute;
    const attr = _getAttr(actor, attr_name);
    if (attr) {
        // Generate an OLRoll for the attribute
        let olroll = await OLRoll(attr_name, attr);
        if (olroll.roll) {
            // Generate a chat message template using OLRoll data
            const template = "systems/openlegends/templates/dialog/roll-chat.html";
            const data = {
                "name": item.data.action.name,
                "type": item.type,
                "notes": item.data.details.notes,
                "attr": olroll.attr,
                "target": item.data.action.target,
                "adv": olroll.adv
            }
            const html = await renderTemplate(template, data);
            // Roll the roll
            olroll.roll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: html
            });
        }
    }
}


export async function OLRoll(attr_name, attr) {
    const to_return = {
        "roll": null,
        "attr": {
            "name": attr_name,
            "score": attr.score,
            "dice": attr.dice
        },
        "adv": {
            "type": "",
            "value": 0
        }
    }

    // Create the Dialog window
    const adv = await _OLRollDialog(attr_name, attr);
    if (adv == null)
        return to_return;

    const dice = attr.dice
    // If score is zero
    if (attr.score <= 0) {
        to_return.attr.dice = null;
        if (adv > 0) {
            to_return.adv.type = "Advantage";
            to_return.adv.value = 1;
            to_return.roll = new Roll('2d20kh1X');
        } else if (adv < 0) {
            to_return.adv.type = "Disadvantage";
            to_return.adv.value = 1;
            to_return.roll = new Roll('2d20kl1X');
        } else {
            to_return.adv = null;
            to_return.roll = new Roll('1d20X');
        }
    } else {
        // Normal roll
        if (adv == 0) {
            to_return.adv = null;
            to_return.roll = new Roll('1d20X + ' + dice.num + dice.die + 'X');
        } else {
            const diemul = Math.abs(adv) + 1;
            to_return.adv.value = Math.abs(adv);
            var advstr = ""
            if (adv < 0) {
                to_return.adv.type = "Disadvantage";
                advstr = 'kl' + dice.num;
            } else {
                to_return.adv.type = "Advantage";
                advstr = 'kh' + dice.num;
            }
            to_return.roll = new Roll('1d20X + ' + (diemul * dice.num) + dice.die + advstr + 'X');
        }
    }

    return to_return;
}

async function _OLRollDialog(attr_name, attr) {
    const template = "systems/openlegends/templates/dialog/roll-dialog.html";
    const data = { 'attr': attr_name, 'score': attr.score, 'formula': '1d20' }
    if (attr.score > 0)
        data.formula += ' + ' + attr.dice.num + attr.dice.die;

    const html = await renderTemplate(template, data);

    // Create the Dialog window
    return new Promise(resolve => {
        new Dialog({
            title: "Configure Roll",
            content: html,
            buttons: {
                dis: {
                    label: "Dis[1]",
                    callback: () => resolve(-1)
                },
                roll: {
                    label: "Roll[^]",
                    callback: html => resolve(html[0].querySelector("input[name='advlevel']").value)
                },
                adv: {
                    label: "Adv[1]",
                    callback: () => resolve(1)
                }
            },
            default: "roll",
            close: html => resolve(null)
        }).render(true);
    });
}

export function _getAttr(actor, attr_name) {
    // Find the attribute data object using its name
    for (const [_, attr_group] of Object.entries(actor.data.data.attributes)) {
        if (attr_group[attr_name])
            return attr_group[attr_name]
    }
    return null;
}