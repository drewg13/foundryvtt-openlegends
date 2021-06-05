import { rollAttr, rollItem } from "../util/dice.js";
import { move_action_up, move_feat_up, move_gear_up } from "./item-movement.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class olActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["openlegends", "sheet", "actor"],
      // template: "systems/openlegends/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    if (this.actor.data.type == 'character')
      return "systems/openlegends/templates/actor/actor-sheet.html";
    else return "systems/openlegends/templates/actor/npc-sheet.html";
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const actorData = super.getData();
    const sheetData = actorData.data;
    const data = sheetData.data;
    // console.log(actorData);

    if (data.actions == undefined) {
      data.actions = [];
      data.gear    = [];
      data.feats   = [];
      data.perks   = [];
      data.flaws   = [];
    }
    actorData.items.forEach(item => {
      if (item.data.action)
        data.actions.push(item);
      if (item.data.gear)
        data.gear.push(item);
      if (item.type == 'feat')
        data.feats.push(item);
      else if (item.type == 'perk')
        data.perks.push(item);
      else if (item.type == 'flaw')
        data.flaws.push(item);
    });
    data.actions.sort((a, b) => a.data.action.index - b.data.action.index);
    data.gear.sort((a, b) => a.data.gear.index - b.data.gear.index);
    data.feats.sort((a, b) => a.data.index - b.data.index);

    return actorData;
  }

  /** @override */
  async _onDropItemCreate(itemData) {
    const data = this.getData().data.data;
    if (itemData.data.action) {
      itemData.data.action.index = data.actions.length;
      itemData.data.action.name = itemData.name;
    }

    if (itemData.data.gear)
      itemData.data.gear.index = data.gear.length;

    if (itemData.type == 'feat')
      itemData.data.index = data.feats.length;

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
      dataset.actor = this.actor._id;
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
    html.find('.action-edit').change(ev => {
      const tag = ev.currentTarget;
      const item = this.actor.items.get(tag.dataset.item);
      const field = tag.dataset.field;
      const value = tag.value;

      var data = item.data.toJSON();
      if( field == 'name') data.name = value;
      else if( field == 'action_attr') data.data.action.attribute = value;
      else if( field == 'action_name') data.data.action.name = value;
      else if (field == 'action_adv') data.data.action.default_adv = value;
      else if( field == 'notes') data.data.details.notes = value;
      else if( field == 'attack') {
        // Set both attack attribute and find its target
        data.data.action.attribute = value;
        data.data.attacks.forEach(attack => {
          if (attack.attribute == value)
            data.data.action.target = attack.target;
        });
      }
      item.update(data);
    });

    // Update curr hp of npcs if max hp changes
    html.find('.npc_hp_edit').change(ev => {
      const hp_val = $(ev.currentTarget).val()
      const data = this.actor.data.toJSON();
      const hp = data.data.defense.hp;
      hp.max = hp_val;
      hp.value = hp_val;
      this.actor.update(data);
    });

    html.find(".update-npc-attributes").click(ev => {
      const btn = $(ev.currentTarget);
      if (btn.html() == "Edit")
        btn.html("Save");
      else {
        var data = {}
        html.find(".npc-attr-setter").each((i, obj) => {
          data[`data.attributes.${obj.dataset.group}.${obj.dataset.attr}.score`] = parseInt(obj.value);
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
  }

  /* -------------------------------------------- */

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Roll using the appropriate logic -- item vs attribute
    if (dataset.item)
      rollItem(this.actor, this.actor.items.get(dataset.item).data);
    else if (dataset.attr)
      rollAttr(this.actor, dataset.attr);
  }
}
