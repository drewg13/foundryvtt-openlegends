/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class olActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
    else if (actorData.type === 'npc') this._prepareNPCData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    // Calculate level
    data.level = Math.floor(data.xp/3) + 1;

    let trackers = data.trackers;
    let attributes = data.attributes;
    trackers.attr.spent = 0;
    trackers.attr.points = 40 + data.xp*3;
    // Loop through attribute scores, and add their dice to our sheet output.
    for (let [attr_group_name, attr_group] of Object.entries(attributes)) {
      for (let [attr_name, attr] of Object.entries(attr_group)) {
        attr.dice = this.getDieForAttrScore(attr.score);
        trackers.attr.spent += (attr.score*attr.score + attr.score)/2;
      }
    }

    // Set max hp based on: 2 * (Fortitude + Will + Presence) + 10
    // Cap current lethal between 0 and max
    const fort = data.attributes.physical.fortitude.score;
    const will = data.attributes.mental.will.score;
    const pres = data.attributes.social.presence.score;
    const hp = data.defense.hp;
    hp.lethal = Math.min(Math.max(hp.lethal, 0), hp.max);
    hp.hint = 2 * (fort + will + pres) + 10;
    hp.max = Math.max(hp.max, hp.hint);
    hp.value = Math.min(Math.max(hp.value, hp.min), hp.max - hp.lethal);

    // Set guard to 10 + Agility + Might + Armor + Other
    const agi = data.attributes.physical.agility.score;
    const might = data.attributes.physical.might.score;
    var armor = 0
    actorData.items.forEach(item => {
      if (item.type == 'armor') {
        if (item.data.data.equipped && fort >= item.data.data.req_fort)
          armor += item.data.data.defense;
      }
    });
    const guard = data.defense.guard;
    guard.armor = armor;
    guard.guard = Math.max(0, 10 + agi + might + guard.armor + guard.other);

    // Set toughness to 10 + Fortitude + Will + Other
    const tough = data.defense.toughness;
    tough.toughness = Math.max(0, 10 + fort + will + tough.other);

    // Set resolve to 10 + Presence + Will + Other
    const resolve = data.defense.resolve;
    const presence = data.attributes.social.presence.score;
    resolve.resolve = Math.max(0, 10 + presence + will + resolve.other);

    // Calculate feat costs
    var total_feat_cost = 0;
    actorData.items.forEach(item => {
      if (item.type == 'feat')
        total_feat_cost += item.data.data.cost;
    });
    trackers.feats.spent = total_feat_cost;
    trackers.feats.points = 6 + data.xp;

    data.trackers = trackers;
    data.attributes = attributes;
    data.defense.hp = hp;
    data.defense.guard = guard;
    data.defense.toughness = tough;
    data.defense.resolve = resolve;
  }

  _prepareNPCData(actorData) {
    const data = actorData.data;
    console.log(data);
    data.xp = (data.level-1) * 3;

    let trackers = data.trackers;
    let attributes = data.attributes;
    trackers.attr.spent = 0;
    trackers.attr.points = 40 + data.xp*3;
    // Loop through attribute scores, and add their dice to our sheet output.
    for (let [attr_group_name, attr_group] of Object.entries(attributes)) {
      for (let [attr_name, attr] of Object.entries(attr_group)) {
        attr.dice = this.getDieForAttrScore(attr.score);
        trackers.attr.spent += (attr.score*attr.score + attr.score)/2;
        console.log(attr_name, attr.score, trackers.attr.spent);
      }
    }

    // Calculate feat costs
    var total_feat_cost = 0;
    actorData.items.forEach(item => {
      if (item.type == 'feat')
        total_feat_cost += item.data.data.cost;
    });
    trackers.feats.spent = total_feat_cost;
    trackers.feats.points = 6 + data.xp;

    // Update the Actor
    data.trackers = trackers;
    data.attributes = attributes;
  }

  getDieForAttrScore(score) {
    if( score <= 0 )
      return {"str": "X", "num": 0, "die": 0};
    else if( score <= 1)
      return {"str": "1d4", "num": 1, "die": "d4"};
    else if( score <= 2)
      return {"str": "1d6", "num": 1, "die": "d6"};
    else if( score <= 3)
      return {"str": "1d8", "num": 1, "die": "d8"};
    else if( score <= 4)
      return {"str": "1d10", "num": 1, "die": "d10"};
    else if( score <= 5)
      return {"str": "2d6", "num": 2, "die": "d6"};
    else if( score <= 6)
      return {"str": "2d8", "num": 2, "die": "d8"};
    else if( score <= 7)
      return {"str": "2d10", "num": 2, "die": "d10"};
    else if( score <= 8)
      return {"str": "3d8", "num": 3, "die": "d8"};
    else if( score <= 9)
      return {"str": "3d10", "num": 3, "die": "d10"};
    else
      return {"str": "4d8", "num": 4, "die": "d8"};
  }

}