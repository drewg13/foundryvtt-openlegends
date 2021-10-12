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
        attr.modified_score = attr.score + (attr.bonus ? attr.bonus : 0) 
        attr.bonus_class = (attr.bonus ? (attr.bonus > 0 ? 'upgraded' : 'downgraded') : '');
        attr.bonus_str = (attr.bonus && attr.bonus != 0 ? (attr.bonus > 0 ? '+'+attr.bonus : attr.bonus) : '');
        attr.dice = this.getDieForAttrScore(attr.modified_score);
        trackers.attr.spent += (attr.score*attr.score + attr.score)/2;
      }
    }

    // Set max hp based on: 2 * (Fortitude + Will + Presence) + 10 (handle attr substitution)
    // Cap current lethal between 0 and max
    const hp = data.defense.hp;
    const hp_form1 = this.getAttrForName(data.attributes, hp.formula[0].active).modified_score;
    const hp_form2 = this.getAttrForName(data.attributes, hp.formula[1].active).modified_score;
    const hp_form3 = this.getAttrForName(data.attributes, hp.formula[2].active).modified_score;
    const fort = data.attributes.physical.fortitude.modified_score;
    hp.lethal = Math.min(Math.max(hp.lethal, 0), hp.max);
    hp.hint = 2 * (hp_form1 + hp_form2 + hp_form3) + 10;
    hp.hint_str = `2*(${hp.formula[0].active} + ${hp.formula[1].active} + ${hp.formula[2].active})+10 = ${hp.hint}`
    hp.max = hp.hint + hp.other + hp.feat;
    hp.value = Math.min(Math.max(hp.value, hp.min), hp.max - hp.lethal);

    // Set guard to 10 + Agility + Might + Armor + Other (handle attr substitution)
    const guard = data.defense.guard;
    const guard_form1 = this.getAttrForName(data.attributes, guard.formula[0].active).modified_score;
    const guard_form2 = this.getAttrForName(data.attributes, guard.formula[1].active).modified_score;
    guard.formula[0].score = guard_form1;
    guard.formula[1].score = guard_form2;
    var armor = 0
    actorData.items.forEach(item => {
      if (item.type == 'armor') {
        if (item.data.data.equipped && fort >= item.data.data.req_fort)
          armor += item.data.data.defense;
      }
    });
    guard.armor = armor;
    guard.guard = Math.max(0, 10 + guard_form1 + guard_form2 + guard.armor + guard.other);

    // Set toughness to 10 + Fortitude + Will + Other (handle attr substitution)
    const tough = data.defense.toughness;
    const tough_form1 = this.getAttrForName(data.attributes, tough.formula[0].active).modified_score;
    const tough_form2 = this.getAttrForName(data.attributes, tough.formula[1].active).modified_score;
    tough.formula[0].score = tough_form1;
    tough.formula[1].score = tough_form2;
    tough.toughness = Math.max(0, 10 + tough_form1 + tough_form2 + tough.other);

    // Set resolve to 10 + Presence + Will + Other (handle attr substitution)
    const resolve = data.defense.resolve;
    const resolve_form1 = this.getAttrForName(data.attributes, resolve.formula[0].active).modified_score;
    const resolve_form2 = this.getAttrForName(data.attributes, resolve.formula[1].active).modified_score;
    resolve.formula[0].score = resolve_form1;
    resolve.formula[1].score = resolve_form2;
    resolve.resolve = Math.max(0, 10 + resolve_form1 + resolve_form2 + resolve.other);

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
    data.xp = (data.level-1) * 3;

    let trackers = data.trackers;
    let attributes = data.attributes;
    trackers.attr.spent = 0;
    trackers.attr.points = 40 + data.xp*3;
    // Loop through attribute scores, and add their dice to our sheet output.
    for (let [attr_group_name, attr_group] of Object.entries(attributes)) {
      for (let [attr_name, attr] of Object.entries(attr_group)) {
        attr.modified_score = attr.score
        attr.bonus_class = '';
        attr.bonus_str = '';
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

  getAttrForName(attributes, name) {
    var attr = attributes.physical[name]
    if( attr ) return attr;

    attr = attributes.mental[name]
    if( attr ) return attr;

    attr = attributes.social[name]
    if( attr ) return attr;

    attr = attributes.extraordinary[name]
    if( attr ) return attr;

    return null;
  }

}