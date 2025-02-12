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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General
 * Public License along with this program; if not, write to the
 * Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA  02110-1301  USA
 */

import { defineChildWidget } from '../child_widget.js';
import { Button } from './button.js';
import { Value } from './value.js';
import { warning } from '../utils/warning.js';
import {
  rangedOptionsDefaults,
  rangedOptionsTypes,
  makeRanged,
} from '../utils/make_ranged.js';
import { DragValue } from '../modules/dragvalue.js';
import { Scale } from './scale.js';
import { ScrollValue } from '../modules/scrollvalue.js';
import { addClass } from '../utils/dom.js';
import { FORMAT } from '../utils/sprintf.js';

/**
 * The <code>useraction</code> event is emitted when a widget gets modified by user interaction.
 * The event is emitted for the option <code>value</code>.
 *
 * @event ValueButton#useraction
 *
 * @param {string} name - The name of the option which was changed due to the users action
 * @param {mixed} value - The new value of the option
 */
/**
 * This widget combines a {@link Button}, a {@link Scale} and a {@link Value}.
 * ValueButton uses {@link DragValue} and {@link ScrollValue}
 * for setting its value.
 * It inherits all options of {@link DragValue} and {@link Scale}.
 *
 * @class ValueButton
 *
 * @extends Button
 *
 * @param {Object} [options={ }] - An object containing initial options.
 *
 * @property {Number} [options.value=0] - The value of the widget.
 * @property {String} [options.direction="polar"] - Direction for changing the value.
 *   Can be "polar", "vertical" or "horizontal". See {@link DragValue} for more details.
 * @property {Number} [options.blind_angle=20] - If `options.direction` is "polar",
 *   this is the angle of separation between positive and negative value changes.  See {@link DragValue} for more details.
 * @property {Number} [options.rotation=45] - Defines the angle of the center of the positive value
 *   changes. 0 means straight upward. For instance, a value of 45 leads to increasing value when
 *   moving towards top and right. See {@link DragValue} for more details.
 * @property {Number} [options.snap=0.01] - Snap value while dragging.
 * @property {Number} [options.basis=300] - Distance to drag between <code>min</code> and <code>max</code> in pixels.
 */
export class ValueButton extends Button {
  static get _options() {
    return Object.assign({}, Button.getOptionTypes(), rangedOptionsTypes, {
      value: 'number',
      direction: 'string',
      rotation: 'number',
      blind_angle: 'number',
      snap: 'number',
      reset: 'number',
    });
  }

  static get options() {
    return Object.assign({}, rangedOptionsDefaults, {
      value: 0,
      direction: 'polar',
      rotation: 45,
      blind_angle: 20,
      snap: 0.01,
      basis: 300,
      labels: FORMAT('%d'),
      layout: 'top',
      role: 'slider',
    });
  }

  static get static_events() {
    return {
      set_direction: function (value) {
        this.drag.set('direction', value);
      },
      set_drag_rotation: function (value) {
        this.drag.set('rotation', value);
      },
      set_blind_angle: function (value) {
        this.drag.set('blind_angle', value);
      },
    };
  }

  initialize(options) {
    super.initialize(options);

    /**
     * @member {HTMLDivElement} ValueButton#element - The main DIV container.
     *   Has class <code>.aux-valuebutton</code>.
     */

    /**
     * @member {DragValue} ValueButton#drag - The {@link DragValue} module.
     */
    this.drag = new DragValue(this, {
      node: this.element,
      direction: this.options.direction,
      rotation: this.options.rotation,
      blind_angle: this.options.blind_angle,
      limit: true,
    });
    this.drag.on('startdrag', () => this.startInteracting());
    this.drag.on('stopdrag', () => this.stopInteracting());
    /**
     * @member {ScrollValue} ValueButton#scroll - The {@link ScrollValue} module.
     */
    this.scroll = new ScrollValue(this, {
      node: this.element,
      limit: true,
    });
    this.scroll.on('scrollstarted', () => this.startInteracting());
    this.scroll.on('scrollended', () => this.stopInteracting());

    if (this.options.reset === void 0) this.options.reset = this.options.value;
    this.element.addEventListener(
      'dblclick',
      function () {
        this.userset('value', this.options.reset);
        /**
         * Is fired when the user doubleclicks the valuebutton in order to to reset to initial value.
         * The Argument is the new value.
         *
         * @event ValueButton#doubleclick
         *
         * @param {number} value - The value of the widget.
         */
        this.emit('doubleclick', this.options.value);
      }.bind(this)
    );
  }

  draw(O, element) {
    addClass(element, 'aux-valuebutton');

    super.draw(O, element);
  }

  destroy() {
    this.drag.destroy();
    this.scroll.destroy();
    super.destroy();
  }

  // GETTERS & SETTERS
  set(key, value) {
    switch (key) {
      case 'value':
        if (value > this.options.max || value < this.options.min)
          warning(this.element);
        value = this.options.snap_module.snap(value);
        break;
    }
    return super.set(key, value);
  }
}
makeRanged(ValueButton);
function valueClicked() {
  const self = this.parent;
  self.scroll.set('active', false);
  self.drag.set('active', false);
  /**
   * Is fired when the user starts editing the value manually
   *
   * @event ValueButton#valueedit
   *
   * @param {number} value - The value of the widget.
   */
  self.emit('valueedit', self.options.value);
}
function valueDone() {
  const self = this.parent;
  self.scroll.set('active', true);
  self.drag.set('active', true);
  /**
   * Is fired when the user finished editing the value manually
   *
   * @event ValueButton#valueset
   *
   * @param {number} value - The value of the widget.
   */
  self.emit('valueset', self.options.value);
}
/**
 * @member {Value} ValueButton#value - The value widget for editing the value manually.
 */
defineChildWidget(ValueButton, 'value', {
  create: Value,
  show: true,
  map_options: {
    value: 'value',
  },
  default_options: {
    format: function (val) {
      return val.toFixed(2);
    },
    size: 5,
  },
  userset_delegate: true,
  static_events: {
    dblclick: function (e) {
      e.stopPropagation();
    },
    valueclicked: valueClicked,
    valuedone: valueDone,
  },
});

/**
 * @member {Scale} ValueButton#scale - The {@link Scale} showing the value.
 */
defineChildWidget(ValueButton, 'scale', {
  create: Scale,
  show: true,
  toggle_class: true,
  inherit_options: true,
  map_options: {
    value: 'bar',
  },
  blacklist_options: ['layout'],
  default_options: {
    layout: 'top',
  },
});
