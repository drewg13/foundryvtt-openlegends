/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class olItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    const itemData = this;

    if (itemData.type === 'boon') this._prepareBoonData(itemData);
  }

  _prepareBoonData(itemData) {
    const data = itemData.system;
  }
}
