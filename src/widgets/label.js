/*
 * This file is part of AUX.
 *
 * AUX is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * AUX is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General
 * Public License along with this program; if not, write to the
 * Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA  02110-1301  USA
 */

import { element, add_class } from './../utils/dom.js';
import { define_class } from './../widget_helpers.js';
import { Widget } from './widget.js';

export const Label = define_class({
    /**
     * Label is a simple text field displaying strings.
     *
     * @class Label
     * 
     * @extends Widget
     * 
     * @property {Object} options
     * 
     * @param {Mixed} [options.label=""] - The content of the label. Can be formatted via `options.format`.
     * @param {Function|Boolean} [options.format=false] - Optional format function.
     */
    Extends: Widget,
    _options: Object.assign(Object.create(Widget.prototype._options), {
        label: "string",
        format: "function|boolean"
    }),
    options: {
        label: "",
        format: false,
    },
    initialize: function (options) {
        if (!options.element) options.element = element("div");
        Widget.prototype.initialize.call(this, options);
        /** @member {HTMLDivElement} Label#element - The main DIV container.
         * Has class <code>.aux-label</code>.
         */
        this._text = document.createTextNode("");
    },
    draw: function(O, element)
    {
      add_class(element, "aux-label");
      element.appendChild(this._text);

      Widget.prototype.draw.call(this, O, element);
    },
    
    redraw: function () {
        var I = this.invalid;
        var O = this.options;

        Widget.prototype.redraw.call(this);

        if (I.label || I.format) {
            I.label = I.format = false;
            this._text.data = O.format ? O.format.call(this, O.label) : O.label;
        }
    },
});
