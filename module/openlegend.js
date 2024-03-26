// Import Modules
import { olActor } from "./actor/actor.js";
import { olActorSheet } from "./actor/actor-sheet.js";
import { olNPCActorSheet } from "./actor/npc-sheet.js";
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

  // Register settings
  game.settings.register("openlegend", "alt_d20_explosion", {
    name: "Alternate D20 Explosions",
    hint: "D20's explode as scaling attribute dice rahter than d20s",
    scope: "world",
    config: true,
    type: Boolean,
    choices: {
      true: "On",
      false: "Off"
    },
    default: false,
    onChange: value => {
      console.log(value)
    }
  });

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {formula: "1d20X"};
  Combatant.prototype._getInitiativeFormula = _getInitiativeFormula;

  // Define custom Entity classes
  CONFIG.Actor.documentClass = olActor;
  CONFIG.Item.documentClass = olItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("openlegend", olActorSheet, { types: ["character"], makeDefault: true });
  Actors.registerSheet("openlegend", olNPCActorSheet, { types: ["npc"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("openlegend", olItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    let outStr = '';
    for (let arg in arguments) {
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
    return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper('gtz', function (value) {
    return value > 0;
  });

  // Preload template partials.
  preloadHandlebarsTemplates();

});

Hooks.once("ready", async function() {

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => macros.createOLMacro(data, slot));

  //Set up token status effects from Boons/Banes to replace defaults
  let statusEffects = [];
  const packBanes = await game.packs.get("openlegend.banes").getDocuments();
  packBanes.forEach( i => { statusEffects.push ({"id": i.name.slugify(), "name": i.name, "icon": i.img.replace(/blackbackground|Blackbackground/g, 'whitetransparent')}) });
  const packBoons = await game.packs.get("openlegend.boons").getDocuments();
  packBoons.forEach( i => { statusEffects.push ({"id": i.name.slugify(), "name": i.name, "icon": i.img.replace(/blackbackground|Blackbackground/g, 'whitetransparent')}) });
  // add all Banes and Boons in world items to accommodate homebrew
  game.items.contents.forEach( i => { if( (i.type === "boon") || (i.type === "bane") ){ statusEffects.push ({"id": i.name.slugify(), "name": i.name, "icon": i.img.replace(/blackbackground|Blackbackground/g, 'whitetransparent')}) } });
  // add 'dead' effect
  statusEffects.push( {id: 'dead', name: 'EFFECT.StatusDead', icon: 'icons/svg/skull.svg'} );
  // alpha sort effects by name
  CONFIG.statusEffects = statusEffects.sort(function(a,b){
    let x = a.name.toLowerCase();
    let y = b.name.toLowerCase();
    if(x>y){return 1;}
    if(x<y){return -1;}
    return 0;
  });

  CONFIG.specialStatusEffects = {DEFEATED: 'dead', INVISIBLE: 'concealment', BLIND: 'blinded'};

  Hooks.on("combatStart", (combat, updateData) => {
    combat.combatants.forEach( c => {
      let tokenActor = combat.scene.tokens.get( c.tokenId )?.actor;
      let linkedActor = game.actors.get( c.actorId );
      let actor = tokenActor?.actorLink ? linkedActor : tokenActor;
      // reset flags to default for beginning of combat
      actor.update( { "system": { "defendUsed": false, "majorUnavailable": false } } )
    } )
  });

  Hooks.on("preDeleteCombat", (combat, options, userId) => {
    combat.combatants.forEach( c => {
      let tokenActor = combat.scene.tokens.get( c.tokenId )?.actor;
      let linkedActor = game.actors.get( c.actorId );
      let actor = tokenActor?.actorLink ? linkedActor : tokenActor;
      // reset flags to default at end of combat
      actor.update( { "system": { "defendUsed": false, "majorUnavailable": false } } );
    } )
  });

  Hooks.on("deleteCombat", (combat, options, userId) => {
    combat.combatants.forEach( c => {
      let tokenActor = combat.scene.tokens.get( c.tokenId )?.actor;
      let linkedActor = game.actors.get( c.actorId );
      let actor = tokenActor?.actorLink ? linkedActor : tokenActor;
      // ensure that combatant sheets re-render, if open, to ensure controls removed
      actor.sheet.render(false);
    } )
  });

  Hooks.on("updateCombat", async (combat, updateData, updateOptions) => {
    // get actor for current combatant, check for defendUsed, reset to false for start of turn
    let tokenActor = combat.scene.tokens.get( combat.combatant?.tokenId )?.actor;
    let linkedActor = game.actors.get( combat.combatant?.actorId );
    let actor = tokenActor?.actorLink ? linkedActor : tokenActor;

    if( actor?.system.defendUsed ) {
      await actor.update( { "system.defendUsed": false } )
    }

    // get actor for previous combatant, check for majorUnavailable, reset to false for end of turn
    let prevTokenActor = combat.scene.tokens.get( combat.previous?.tokenId )?.actor;
    let prevLinkedActor = combat.combatants.get( combat.previous?.combatantId )?.actor;
    let prevActor = prevTokenActor?.actorLink ? prevLinkedActor : prevTokenActor;

    if( prevActor?.system.majorUnavailable ) {
      await prevActor.update( { "system.majorUnavailable": false } )
    }

    // set majorUnavailable at end of turn for next turn, if defendUsed was set this turn
    if ( prevActor?.system.defendUsed ){ await prevActor.update( { "system.majorUnavailable": true } ) }

  });
});

export const _getInitiativeFormula = function() {
  const actor = this.actor;
  if ( !actor ) return "1d20";
  const agi = actor.system.attributes.physical.agility.dice;

  const init_mod = actor.system.initiative_mod;
  // If this actor doesn't have an init mod, or the init_mod is 0, default d10
  if ( init_mod === undefined || init_mod === 0) {
    if (agi.num === 0)
      return "1d20X";
    else return `1d20X + ${agi.str}X`;
  // If it has an init mod, and that mod is not 0, and its agi score is 0
  } else if (agi.num === 0) {
    if (init_mod < 0)
      return "2d20kl1X";
    else
      return "2d20kh1X";
  }
  // Generate KH/KL for adv/dis
  const keep_str = init_mod < 0 ? `kl${agi.num}X` : `kh${agi.num}X`;
  const dice_to_roll = Math.abs(init_mod) + agi.num;
  const formula = `1d20X + ${dice_to_roll}${agi.die}${keep_str}`;
  return formula;
};