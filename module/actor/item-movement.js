
export function move_action_up(ev) {
    // Get the item to move up
    const tag = ev.currentTarget;
    const item = this.actor.items.get(tag.dataset.item);
    // Get this items current and new indexes
    const curr_index = item.system.action.index;
    const new_index = curr_index - 1;
    // Skip if already at top
    if (curr_index > 0) {
        // Find the item above it
        this.actor.items.forEach(_sub_item => {
            if (_sub_item.system.action) {
                const i = _sub_item.system.action.index;
                if (i === new_index) {
                    // Get the actual owned item and update its index
                    const sub_item = this.actor.items.get(_sub_item._id);
                    sub_item.update({'system.action.index': curr_index});
                }
            }
        });
        // Update the main items index
        item.update({'system.action.index': new_index});
    }
}

export function move_gear_up(ev) {
    // Get the item to move up
    const tag = ev.currentTarget;
    const item = this.actor.items.get(tag.dataset.item);
    // Get this items current and new indexes
    const curr_index = item.system.gear.index;
    const new_index = curr_index - 1;
    // Skip if already at top
    if (curr_index > 0) {
        // Find the item above it
        this.actor.items.forEach(_sub_item => {
            if (_sub_item.system.gear) {
                const i = _sub_item.system.gear.index;
                if (i === new_index) {
                    // Get the actual owned item and update its index
                    const sub_item = this.actor.items.get(_sub_item._id);
                    sub_item.update({'system.gear.index': curr_index});
                }
            }
        });
        // Update the main items index
        item.update({'system.gear.index': new_index});
    }
}

// Move feat up in the feat rows
export function move_feat_up(ev) {
    // Get the item to move up
    const tag = ev.currentTarget;
    const item = this.actor.items.get(tag.dataset.item);
    // Get this items current and new indexes
    const curr_index = item.system.index;
    const new_index = curr_index - 1;
    // Skip if already at top
    if (curr_index > 0) {
        // Find the item above it
        this.actor.items.forEach(_sub_item => {
            if (_sub_item.type === 'feat') {
                const i = _sub_item.system.index;
                if (i === new_index) {
                    // Get the actual owned item and update its index
                    const sub_item = this.actor.items.get(_sub_item._id);
                    sub_item.update({'system.index': curr_index});
                }
            }
        });
        // Update the main items index
        item.update({'system.index': new_index});
    }
}