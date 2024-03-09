import { olActorSheet } from "./actor-sheet.js";
import { move_action_up, move_feat_up, move_gear_up } from "./item-movement.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {olActorSheet}
 */
export class olNPCActorSheet extends olActorSheet {

  /** @override */
  static get defaultOptions() {
    const options = foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["openlegend", "sheet", "actor", "npc"],
      width: 750,
    });
    return options;
  }

  /** @override */
  get template() {
    return "systems/openlegend/templates/actor/npc-sheet.html";
  }

}
