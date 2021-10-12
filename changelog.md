# Changelog

## 2.0.3

* Added ability to Ctrl+Click rollables to quick-roll (skip dialog)
  * Doesn't work with rolls that have been put on the macro bar
* Added attribute settings button
  * You can now apply bonuses/malices to attributes for things like Extraordinary Focus
* Fixed bugs with initiative rolling
  * Not using agility, ignoring the quick-advantage slot
  * Due to Foundry 0.8 changes

## 2.0.2

* Updated to Foundry 0.8.8
* Added ability to specify an 'Explosion Modifier' on items (primarily for Destructive Trance)
  * For Attacks, Weapons, and Banes -- when you modify the attack list, you can also specify a "Explode on max minus" value
  * This allows you to explode on values less than max (e.g., a value of 2, would mean that a d20 explodes on 18+, and a d6 expldoes on 4+)
  * 1's Never explode (to prevent infinite recursion)
* Added an alternative D20 explosion rule (accessible in System Settings)
  * If enabled, D20s explode based on the attribute used to roll it (d4-d10)

## 2.0.1

* Added customizability to Defense calculation
  * HP, Guard, Toughness and Resolve can now be edited to allow you to use whichever attributes you want
  * Added 'from feats' and 'from other' to HP calculation. Max HP is no longer editable
* Fixed a bug with the NPC sheet that was causing the edit tab to open/close when pressing enter on input fields

## 2.0.0

* Updated System to Foundry 8.6

## 1.1.0

* Added Rules and GM-Screen compendiums
* Fixed character WL reverting to 2 when changed
* Added 'Generic' item
  * Has spots for Quantity, Banes, Boons, Properties, Categories, Attacks, WL, and a description
* Added 'Equipped' checkbox to armor items
  * Only equipped items get added to armor stat
  * Can have multiple armors equipped -- not a bug
* Added 'Show Action' to weapon and attack items
  * This toggles whether or not to create and show an Action in the action bar for a given item

## 1.0.0

* Fully functioning prototype of Open Legend RPG system in Foundry v7.6
