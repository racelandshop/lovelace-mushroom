import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import memoizeOne from "memoize-one";
import { assert } from "superstruct";
import setupCustomlocalize from "../../localize";
import { configElementStyle } from "../../utils/editor-styles";
import { GENERIC_FIELDS } from "../../utils/form/fields";
import { HaFormSchema } from "../../utils/form/ha-form";
import { stateIcon } from "../../utils/icons/state-icon";
import { loadHaComponents } from "../../utils/loader";
import { COVER_CARD_EDITOR_NAME, COVER_ENTITY_DOMAINS } from "./const";
import { CoverCardConfig, coverCardConfigStruct } from "./cover-card-config";

const COVER_FIELDS = ["show_buttons_control", "show_position_control"];

@customElement(COVER_CARD_EDITOR_NAME)
export class CoverCardEditor extends LitElement implements LovelaceCardEditor {
    @property({ attribute: false }) public hass?: HomeAssistant;

    @state() private _config?: CoverCardConfig;

    connectedCallback() {
        super.connectedCallback();
        void loadHaComponents();
    }

    public setConfig(config: CoverCardConfig): void {
        assert(config, coverCardConfigStruct);
        this._config = config;
    }

    private _schema = memoizeOne((icon?: string): HaFormSchema[] => [
        { name: "entity", selector: { entity: { domain: COVER_ENTITY_DOMAINS } } },
        { name: "name", selector: { text: {} } },
        {
            type: "grid",
            name: "",
            schema: [{ name: "icon", selector: { icon: { placeholder: icon } } }],
        },
        {
            type: "grid",
            name: "",
            schema: [
                { name: "layout", selector: { "mush-layout": {} } },
                { name: "hide_state", selector: { boolean: {} } },
            ],
        },
        {
            type: "grid",
            name: "",
            schema: [
                { name: "show_position_control", selector: { boolean: {} } },
                { name: "show_buttons_control", selector: { boolean: {} } },
            ],
        },
        { name: "tap_action", selector: { "mush-action": {} } },
        { name: "hold_action", selector: { "mush-action": {} } },
        { name: "double_tap_action", selector: { "mush-action": {} } },
    ]);

    private _computeLabelCallback = (schema: HaFormSchema) => {
        const customLocalize = setupCustomlocalize(this.hass!);

        if (GENERIC_FIELDS.includes(schema.name)) {
            return customLocalize(`editor.card.generic.${schema.name}`);
        }
        if (COVER_FIELDS.includes(schema.name)) {
            return customLocalize(`editor.card.cover.${schema.name}`);
        }
        return this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema.name}`);
    };

    protected render(): TemplateResult {
        if (!this.hass || !this._config) {
            return html``;
        }

        const entityState = this._config.entity ? this.hass.states[this._config.entity] : undefined;
        const entityIcon = entityState ? stateIcon(entityState) : undefined;
        const icon = this._config.icon || entityIcon;
        const schema = this._schema(icon);

        return html`
            <ha-form
                .hass=${this.hass}
                .data=${this._config}
                .schema=${schema}
                .computeLabel=${this._computeLabelCallback}
                @value-changed=${this._valueChanged}
            ></ha-form>
        `;
    }

    private _valueChanged(ev: CustomEvent): void {
        fireEvent(this, "config-changed", { config: ev.detail.value });
    }

    static get styles(): CSSResultGroup {
        return [configElementStyle];
    }
}
