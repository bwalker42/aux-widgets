/*
 * This file is part of Toolkit.
 *
 * Toolkit is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * Toolkit is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General
 * Public License along with this program; if not, write to the
 * Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA  02110-1301  USA
 */
 
 /**
 * The <code>useraction</code> event is emitted when a widget gets modified by user interaction.
 * The event is emitted for the <code>state</code> option.
 * 
 * @event TK.Button#useraction
 * 
 * @param {string} name - The name of the option which was changed due to the users action.
 * @param {mixed} value - The new value of the option.
 */
 
"use strict";
(function(w, TK){
var class_regex = /[^A-Za-z0-9_\-]/;
function is_class_name (str) {
    return !class_regex.test(str);
}

TK.Button = TK.class({
    /**
     * TK.Button is a simple, clickable widget to trigger funcions. It fires a
     * couple of click-related events and consists of a label and an icon.
     * Buttons are used as a base to build different other widgets from, too.
     * 
     * @param {Object} options
     * 
     * @property {string} [options.label=""] - Text for the button label
     * @property {string} [options.icon=""] - URL to an icon for the button OR icon class (see styles/fonts/Toolkit.html)
     * @property {boolean} [options.state=false] - TK.State of the button
     * @property {integer} [options.layout="vertical"] - Determine the arrangement of label and icon.
     *   "vertical" means icon on top of the label, "horizontal" puts the icon left to the label.
     * 
     * @extends TK.Widget
     * 
     * @class TK.Button
     */
    _class: "Button",
    Extends: TK.Widget,
    _options: Object.assign(Object.create(TK.Widget.prototype._options), {
        label: "string",
        icon: "string",
        state: "boolean",
        layout: "int",
    }),
    options: {
        label:            false,
        icon:             false,
        state:            false,
        layout:           "vertical"
    },
    initialize: function (options) {
        var E;
        TK.Widget.prototype.initialize.call(this, options);
        /**
         * @member {HTMLDivElement} TK.Button#element - The main DIV element.
         *      Has class <code>toolkit-button</code>.
         */
        if (!(E = this.element)) this.element = E = TK.element("div");
        TK.add_class(E, "toolkit-button");
        this.widgetize(E, true, true, true);
        
        /**
         * @member {HTMLDivElement} TK.Button#_cell - An internal container for label and icon.
         *  Has class <code>toolkit-cell</code>
         */
        this._cell  = TK.element("div","toolkit-cell");
        E.appendChild(this._cell);
        
        if (options.label)
            this.options.show_label = true;
        if (options.icon)
            this.options.show_icon = true;
    },
    destroy: function () {
        TK.Widget.prototype.destroy.call(this);
    },

    redraw: function() {
        TK.Widget.prototype.redraw.call(this);
        var I = this.invalid;
        var O = this.options;
        var E = this.element;
        
        if (I.layout) {
            I.layout = false;
            TK.toggle_class(E, "toolkit-vertical", O.layout === "vertical");
            TK.toggle_class(E, "toolkit-horizontal", O.layout !== "vertical");
        }

        if (I.state) {
            I.state = false;
            TK.toggle_class(E, "toolkit-active", O.state);
        }

        /* FIXME: These two cases are not solved using the ChildElement API in order
         * to support TK.Toggle */
        if (O.show_icon && I.validate("icon")) {
            var icon = this._icon;
            var old = this._icon_old;
            if (old && is_class_name(old))
                TK.remove_class(icon, old);
            var has_icon = !!O.icon;
            if (has_icon) {
                if (is_class_name(O.icon)) {
                    icon.style["background-image"] = null;
                    TK.add_class(icon, O.icon);
                } else {
                    icon.style["background-image"] = "url(\"" + O.icon + "\")";
                }
            }
            TK.toggle_class(E, "toolkit-has-icon", has_icon);
        }

        if (O.show_label && I.validate("label")) {
            var _label = this._label;
            var has_value = O.label !== false;
            if (has_value) {
                TK.set_content(_label, O.label);
            }
            TK.toggle_class(this.element, "toolkit-has-label", has_value);
        }
    },
    set: function (key, val) {
        if (key == "icon") {
            this._icon_old = this.options.icon;
        }
        return TK.Widget.prototype.set.call(this, key, val);
    },
});
/**
 * @member {HTMLImageElement} TK.Button#_icon - The icon of the button.
 *      Has class <code>toolkit-icon</code>.
 */
TK.ChildElement(TK.Button, "icon", {
    show: true,
    //option: "icon",
    //display_check: function(v) {
        //return typeof(v) === "string" && v.length;
    //},
    create: function() {
        var icon = TK.element("div","toolkit-icon");
        return icon;
    },
    append: function() {
        this._cell.appendChild(this._icon);
    },
    toggle_class: true,
});
/**
 * @member {HTMLDivElement} TK.Button#_label - The label of the button.
 *      Has class <code>toolkit-label</code>.
 */
TK.ChildElement(TK.Button, "label", {
    show: true,
    //option: "label",
    //display_check: function(v) {
        //return typeof(v) === "string" && v.length;
    //},
    append: function() {
        this._cell.appendChild(this._label);
    },
});
})(this, this.TK);
