import { rollAttr, rollItem } from "../util/dice.js";
import { move_action_up, move_feat_up, move_gear_up } from "./item-movement.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class olActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["openlegend", "sheet", "actor"],
      // template: "systems/openlegend/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{dragSelector: ".macro", dropSelector: null}]
    });
  }

  /** @override */
  get template() {
    if (this.actor.type === 'character')
      return "systems/openlegend/templates/actor/actor-sheet.html";
    else return "systems/openlegend/templates/actor/npc-sheet.html";
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    const actorData = super.getData();
    const sheetData = actorData.data;
    sheetData.owner = actorData.owner;
    sheetData.editable = actorData.editable;
    // console.log(actorData);

    if (sheetData.actions === undefined) {
      sheetData.actions = [];
      sheetData.gear    = [];
      sheetData.feats   = [];
      sheetData.perks   = [];
      sheetData.flaws   = [];
    }
    actorData.items.forEach(item => {
      if (item.system.action)
        sheetData.actions.push(item);
      if (item.system.gear)
        sheetData.gear.push(item);
      if (item.type === 'feat')
        sheetData.feats.push(item);
      else if (item.type === 'perk')
        sheetData.perks.push(item);
      else if (item.type === 'flaw')
        sheetData.flaws.push(item);
    });
    sheetData.actions.sort((a, b) => a.system.action.index - b.system.action.index);
    sheetData.gear.sort((a, b) => a.system.gear.index - b.system.gear.index);
    sheetData.feats.sort((a, b) => a.system.index - b.system.index);

    sheetData.system.notes = await TextEditor.enrichHTML(sheetData.system.notes, {secrets: actorData.isOwner});

    return sheetData;
  }

  /** @override */
  async _onDropItemCreate(itemData) {
    const data = await this.getData();
    if (itemData.system.action) {
      itemData.system.action.index = data.actions.length;
      itemData.system.action.name = itemData.name;
    }

    if (itemData.system.gear)
      itemData.system.gear.index = data.gear.length;

    if (itemData.type === 'feat')
      itemData.system.index = data.feats.length;

    // Create the owned item as normal
    return super._onDropItemCreate(itemData);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html.find('.macro').on('dragstart', ev => {
      const dataset = ev.currentTarget.dataset;
      dataset.actor = this.actor.uuid;
      ev.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(dataset));
    });

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const tag = ev.currentTarget;
      const item = this.actor.items.get(tag.dataset.item);
      item.sheet.render(true);
    });

    // Move items up in their corresponding rows
    html.find('.action-move-up').click(move_action_up.bind(this));
    html.find('.gear-move-up').click(move_gear_up.bind(this));
    html.find('.feat-move-up').click(move_feat_up.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const tag = ev.currentTarget;
      const item = this.actor.items.get(tag.dataset.item);
      item.delete();
    });

    // Update action 'items' directly
    html.find('.action-edit').change( ev => {
      const tag = ev.currentTarget;
      const item = this.actor.items.get(tag.dataset.item);
      const field = tag.dataset.field;
      const value = tag.value;

      let data = foundry.utils.deepClone(item.system);
      if( field === 'action_attr') data.action.attribute = value;
      else if( field === 'action_name') data.action.name = value;
      else if (field === 'action_adv') data.action.default_adv = value;
      else if( field === 'notes') data.details.notes = value;
      else if( field === 'attack') {
        // Set both attack attribute and find its target
        data.action.attribute = value;
        data.attacks.forEach(attack => {
          if (attack.attribute === value)
            data.action.target = attack.target;
        });
      }
      item.update({"system": data});
    });

    // Update curr hp of npcs if max hp changes
    html.find('.npc_hp_edit').change(ev => {
      const hp_val = $(ev.currentTarget).val()
      const data = this.actor.system;
      const hp = data.defense.hp;
      hp.max = hp_val;
      hp.value = hp_val;
      this.actor.update({ "system.defense": { hp } } );
    });

    html.find(".update-npc-attributes").click(ev => {
      const btn = $(ev.currentTarget);
      if (btn.html() === "Edit")
        btn.html("Save");
      else {
        let data = {}
        html.find(".npc-attr-setter").each((i, obj) => {
          data[`system.attributes.${obj.dataset.group}.${obj.dataset.attr}.score`] = parseInt(obj.value);
        });
        this.actor.update(data);
        btn.html("Edit");
      }
      html.find(".npc-attributes-display").toggle();
      html.find(".npc-attributes-edit").toggle();
    });

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));
    html.find('.init-rollable').click(ev => {
      this.actor.rollInitiative({createCombatants: true});
    });

    // Configurable settings.
    html.find('.settings').click(this._onConfigure.bind(this));
    html.find('.attr-settings').click(this._onAttrConfigure.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const ctrl_held = event.ctrlKey
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Roll using the appropriate logic -- item vs attribute
    if (dataset.item)
      rollItem(this.actor, this.actor.items.get(dataset.item), ctrl_held);
    else if (dataset.attr)
      rollAttr(this.actor, dataset.attr, ctrl_held);
  }

  /**
   * Handle clickable settings.
   * @param {Event} event The originating click event
   * @private
   */
  async _onConfigure(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const data = this.actor.system;
    const defense = data.defense[dataset.defense];

    let result = await this._SettingsDialog(dataset.name, defense);
    if( result ) {
      result.forEach((item, index) => {
        defense.formula[index].active = item.value;
      });

      this.actor.update(data);
    }
  }

  async _SettingsDialog(name, defense) {
    const template = "systems/openlegend/templates/dialog/defense-settings.html";
    const attrs = this.actor.system.attributes;
    const data = { 'name': name, 'formula': defense.formula, 'attrs': attrs }

    const html = await renderTemplate(template, data);
    // Create the Dialog window
    return new Promise(resolve => {
        new Dialog({
            title: data.name,
            content: html,
            buttons: {
                update: {
                    label: "Update",
                    callback: html => resolve(html[0].querySelectorAll("select"))
                }
            },
            default: "update",
            close: html => resolve(null)
        }).render(true);
    });
  }

  async _onAttrConfigure(event) {
    event.preventDefault();
    const data = this.actor.system;
    const attrs = data.attributes;

    let result = await this._AttrSettingsDialog();
    if( result ) {
      result.forEach((item, index) => {
        const dataset = item.dataset
        if (item.value !== '')
          attrs[dataset.group][dataset.attr]['bonus'] = parseInt(item.value);
      });

      this.actor.update(data);
    }
  }

  async _AttrSettingsDialog() {
    const template = "systems/openlegend/templates/dialog/attr-settings.html";
    const attrs = this.actor.system.attributes;
    const data = { 'attributes': attrs }

    const html = await renderTemplate(template, data);
    // Create the Dialog window
    return new Promise(resolve => {
        new Dialog({
            title: data.name,
            content: html,
            buttons: {
                update: {
                    label: "Update",
                    callback: html => resolve(html[0].querySelectorAll("input"))
                }
            },
            default: "update",
            close: html => resolve(null)
        }).render(true);
    });
  }
}
