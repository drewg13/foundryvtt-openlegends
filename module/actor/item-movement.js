
export function move_action_up(ev) {
    // Get the item to move up
    const tag = ev.currentTarget;
    const item = this.actor.items.get(tag.dataset.item);
    // Get this items current and new indexes
    const curr_index = item.data.data.action.index;
    const new_index = curr_index - 1;
    // Skip if already at top
    if (curr_index > 0) {
        // Find the item above it
        this.actor.data.items.forEach(_sub_item => {
            if (_sub_item.data.data.action) {
                const i = _sub_item.data.data.action.index;
                if (i == new_index) {
                    // Get the actual owned item and update its index
                    const sub_item = this.actor.items.get(_sub_item._id);
                    sub_item.update({'data.action.index': curr_index});
                }
            }
        });
        // Update the main items index
        item.update({'data.action.index': new_index});
    }
}

export function move_gear_up(ev) {
    // Get the item to move up
    const tag = ev.currentTarget;
    const item = this.actor.items.get(tag.dataset.item);
    // Get this items current and new indexes
    const curr_index = item.data.data.gear.index;
    const new_index = curr_index - 1;
    // Skip if already at top
    if (curr_index > 0) {
        // Find the item above it
        this.actor.data.items.forEach(_sub_item => {
            if (_sub_item.data.data.gear) {
                const i = _sub_item.data.data.gear.index;
                if (i == new_index) {
                    // Get the actual owned item and update its index
                    const sub_item = this.actor.items.get(_sub_item._id);
                    sub_item.update({'data.gear.index': curr_index});
                }
            }
        });
        // Update the main items index
        item.update({'data.gear.index': new_index});
    }
}

// Move feat up in the feat rows
export function move_feat_up(ev) {
    // Get the item to move up
    const tag = ev.currentTarget;
    const item = this.actor.items.get(tag.dataset.item);
    // Get this items current and new indexes
    const curr_index = item.data.data.index;
    const new_index = curr_index - 1;
    // Skip if already at top
    if (curr_index > 0) {
        // Find the item above it
        this.actor.data.items.forEach(_sub_item => {
            if (_sub_item.type == 'feat') {
                const i = _sub_item.data.data.index;
                if (i == new_index) {
                    // Get the actual owned item and update its index
                    const sub_item = this.actor.items.get(_sub_item._id);
                    sub_item.update({'data.index': curr_index});
                }
            }
        });
        // Update the main items index
        item.update({'data.index': new_index});
    }
}