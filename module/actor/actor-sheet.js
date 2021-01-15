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
      template: "systems/openlegends/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    
    data.actions = [];
    data.gear    = [];
    data.feats   = [];
    data.perks   = [];
    data.flaws   = [];
    data.items.forEach(item => {
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

    return data;
  }

  /** @override */
  async _onDropItemCreate(itemData) {
    const data = this.getData();
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
      const item = this.actor.getOwnedItem(tag.dataset.item);
      item.sheet.render(true);
    });

    // Move items up in their corresponding rows
    html.find('.action-move-up').click(move_action_up.bind(this));
    html.find('.gear-move-up').click(move_gear_up.bind(this));
    html.find('.feat-move-up').click(move_feat_up.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const tag = ev.currentTarget;
      const item = this.actor.getOwnedItem(tag.dataset.item);
      item.delete();
    });

    // Update action 'items' directly
    html.find('.action-edit').change(ev => {
      const tag = ev.currentTarget;
      const item = this.actor.getOwnedItem(tag.dataset.item);
      const field = tag.dataset.field;
      const value = tag.value;

      if( field == 'name') item.data.name = value;
      else if( field == 'action_attr') item.data.data.action.attribute = value;
      else if( field == 'action_name') item.data.data.action.name = value;
      else if( field == 'notes') item.data.data.details.notes = value;
      else if( field == 'attack') {
        // Set both attack attribute and find its target
        item.data.data.action.attribute = value;
        item.data.data.attacks.forEach(attack => {
          if (attack.attribute == value)
            item.data.data.action.target = attack.target;
        });
      }

      item.update(item.data);
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
      rollItem(this.actor, this.actor.getOwnedItem(dataset.item).data);
    else if (dataset.attr)
      rollAttr(this.actor, dataset.attr);
  }
}
