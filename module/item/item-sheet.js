/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class olItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["openlegends", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/openlegends/templates/item";
    // Return a single sheet for all item types.
    return `${path}/${this.item.data.type}.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".add-attack").click(async () => {
      const template = "systems/openlegends/templates/item/parts/attack-target.html";
      const data = { 'attack': {}, 'attributes': this.object.data.data.attributes };
      const new_attack = await renderTemplate(template, data);
      html.find(".attack-list").append(new_attack);
    });

    html.find(".attack-delete").click(ev => $(ev.currentTarget).closest('li').remove());
    html.find(".update-action").click(ev => {
      const btn = $(ev.currentTarget);
      if (btn.html() == "Edit")
        btn.html("Save");
      else {
        var data = {}
        html.find(".attr-checkbox").each((i, obj) => {
          data['data.attributes.' + obj.dataset.attr] = obj.checked;
        });

        if (this.object.data.data.attacks) {
          const attacks = []
          html.find(".action-attack").each((i, attack) => {
            const attr = $(attack).find('.attack-attribute').val();
            const target = $(attack).find('.attack-target').val();
            attacks.push({ "attribute": attr, "target": target });
          });
          data['data.attacks'] = attacks;
        }
        this.object.update(data);
        btn.html("Edit");
      }

      html.find(".action-list").toggle();
      html.find(".action-edit").toggle();
    });

    html.find('.scale').keyup(ev => {
      const input = $(ev.currentTarget);
      const tester = html.find('.scale-tester');
      tester.text(input.val());
      input.width(tester.width() + 5);
    });

    html.find('.scale').each((i, tag) => {
      const tester = html.find('.scale-tester');
      tester.text($(tag).val());
      $(tag).width(tester.width() + 5);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Roll handlers, click handlers, etc. would go here.
  }

  resizeInput() {
    console.log($(this));
    $(this).attr('size', $(this).val().length);
  }
}
