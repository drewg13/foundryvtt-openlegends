// Import Modules
import { olActor } from "./actor/actor.js";
import { olActorSheet } from "./actor/actor-sheet.js";
import { olItem } from "./item/item.js";
import { olItemSheet } from "./item/item-sheet.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import * as macros from "./util/macros.js";

Hooks.once('init', async function() {

  game.openlegend = {
    olActor,
    olItem,
    macros: macros
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {formula: "1d20X"};
  Combat.prototype._getInitiativeFormula = _getInitiativeFormula;

  // Define custom Entity classes
  CONFIG.Actor.entityClass = olActor;
  CONFIG.Item.entityClass = olItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("openlegend", olActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("openlegend", olItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper('ifeq', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper('gtz', function (value) {
    return value > 0;
  });

  // Preload template partials.
  preloadHandlebarsTemplates();
});

Hooks.once("ready", function() {

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => macros.createOLMacro(data, slot));
});

export const _getInitiativeFormula = function(combatant) {
  const actor = combatant.actor;
  if ( !actor ) return "1d20";
  const agi = actor.data.data.attributes.physical.agility.dice;
  
  const init_mod = actor.data.data.initiative_mod;
  // If this actor doesn't have an init mod, or the init_mod is 0, default d10
  if ( init_mod == undefined || init_mod == 0) {
    if (agi.num == 0)
      return "1d20X";
    else return `1d20X + ${agi.str}X`;
  // If it has an init mod, and that mod is not 0, and its agi score is 0
  } else if (agi.num == 0) {
    if (init_mod < 0)
      return "2d20kl1X";
    else
      return "2d20kh1X";
  }
  // Generate KH/KL for adv/dis
  const keep_str = init_mod < 0 ? `kl${agi.num}X` : `kh${agi.num}X`;
  const multiplier = Math.abs(init_mod)+1;
  const dice_to_roll = multiplier * agi.num;
  const formula = `1d20X + ${dice_to_roll}${agi.die}${keep_str}`;
  return formula;
};