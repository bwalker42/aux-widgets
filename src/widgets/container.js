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

/* jshint -W086 */

import { Widget } from './widget.js';
import {
  element,
  addClass,
  removeClass,
  getDuration,
  empty,
  isDomNode,
} from '../utils/dom.js';
import { warn } from '../utils/log.js';
import { defineRender } from '../renderer.js';

function afterHiding() {
  this.__hide_id = false;
  if (this.options.visible !== 'hiding') return;
  removeClass(this.element, 'aux-hiding');
  this.set('visible', false);
}
function afterShowing() {
  this.__hide_id = false;
  if (this.options.visible !== 'showing') return;
  removeClass(this.element, 'aux-showing');
  this.set('visible', true);
}
/**
 * Container represents a <code>&lt;DIV></code> element contining various
 *   other widgets or DOMNodes.
 *
 * Containers have four different display states: <code>show</code>, <code>hide</code>,
 * <code>showing</code> and <code>hiding</code>. Each of these states has a corresponding
 * CSS class called <code>.aux-show</code>, <code>.aux-hide</code>, <code>.aux-showing</code>
 * and <code>.aux-hiding</code>, respectively. The display state can be controlled using
 * the methods {@link Container#show}, {@link Container#hide} and {@link Widget#toggleHidden}.
 *
 * A container can keep track of the display states of its child widgets.
 * The display state of a child can be changed using {@link Container#hideChild},
 * {@link Container#showChild} and {@link Container#toggleChild}.
 *
 * @class Container
 *
 * @extends Widget
 *
 * @param {Object} [options={ }] - An object containing initial options.
 * @param {Array<TK.Widget>} [options.children=[]] - Add child widgets on init. Will not be maintained on runtime! Just for convenience purposes on init.
 *
 * @property {String|HTMLElement} [options.content] - The content of the container. It can either be
 *   a string which is interpreted as HTML or a DOM node. Note that this option will remove all
 *   child nodes from the container element including those added via appendChild.
 * @property {Number} [options.hiding_duration=0] - The duration in ms of the hiding CSS
 *   transition/animation of this container. If this option is set to -1, the transition duration
 *   will be determined by the computed style, which can be rather
 *   expensive. Setting this option explicitly can therefore be an optimization.
 * @property {Number} [options.showing_duration=0] - The duration in ms of the showing CSS
 *   transition/animation of this container. If this option is set to -1, the transition duration
 *   will be determined by the computed style, which can be rather
 *   expensive. Setting this option explicitly can therefore be an optimization.
 * @property {boolean} [options.render_while_hiding=false] - If false, child
 *   widgets stops rendering while the hiding animation of this container is
 *   running.
 */
export class Container extends Widget {
  static get _options() {
    return Object.assign({}, Widget.getOptionTypes(), {
      content: 'string|DOMNode',
      visible: 'string|boolean',
      hiding_duration: 'number',
      showing_duration: 'number',
      children: 'array',
      render_while_hiding: 'boolean',
    });
  }

  static get options() {
    return {
      children: [],
      hiding_duration: 0,
      showing_duration: 0,
      render_while_hiding: false,
    };
  }

  static get static_events() {
    return {
      set_visible: function (val) {
        if (val === 'showing') this.enableDraw();
        if (val === 'hiding' && !this.options.render_while_hiding)
          this.disableDrawChildren();
      },
    };
  }

  static get renderers() {
    return [
      defineRender('content', function (content) {
        if (content === void 0) return;
        const element = this.element;
        empty(element);
        if (typeof content === 'string') {
          element.innerHTML = content;
        } else if (isDomNode(content)) {
          element.appendChild(content);
        } else if (content !== void 0) {
          warn('Unsupported content option: %o', content);
        }
      }),
      defineRender('visible', function (visible) {
        if (typeof visible === 'boolean') return;

        let time;
        const element = this.element;
        removeClass(
          element,
          'aux-hiding',
          'aux-showing',
          'aux-hide',
          'aux-show'
        );

        const { hiding_duration, showing_duration } = this.options;

        if (this.__hide_id !== false) {
          window.clearTimeout(this.__hide_id);
          this.__hide_id = false;
        }

        switch (visible) {
          case 'hiding': {
            time = hiding_duration;

            if (time !== 0) {
              addClass(element, 'aux-hiding');

              if (time === -1) time = getDuration(element);

              if (time > 0) {
                this.__hide_id = window.setTimeout(this.__after_hiding, time);
              } else {
                removeClass(element, 'aux-hiding');
                this.set('visible', false);
              }
            } else {
              this.set('visible', false);
            }
            break;
          }
          case 'showing': {
            time = showing_duration;

            if (time !== 0) {
              addClass(element, 'aux-showing');

              if (time === -1) time = getDuration(element);

              if (time > 0) {
                this.__hide_id = window.setTimeout(this.__after_showing, time);
              } else {
                removeClass(element, 'aux-showing');
                this.set('visible', true);
              }
            } else {
              this.set('visible', true);
            }
            break;
          }
        }
      }),
    ];
  }

  initialize(options) {
    if (!options.element) options.element = element('div');
    super.initialize(options);
    this.hidden_children = [];
    /**
     * @member {HTMLDivElement} Container#element - The main DIV element. Has class <code>.aux-container</code>
     */

    this.__after_hiding = afterHiding.bind(this);
    this.__after_showing = afterShowing.bind(this);
    this.__hide_id = false;

    if (this.options.children) this.appendChildren(this.options.children);
  }

  setParent(parent, no_remove_child) {
    if (parent && !(parent instanceof Container)) {
      warn(
        'Container %o should not be child of non-container %o',
        this,
        parent
      );
    }
    super.setParent(parent, no_remove_child);
  }

  addChild(child) {
    let H = this.hidden_children;
    if (!H) this.hidden_children = H = [];
    H.push(false);
    super.addChild(child);
  }

  removeChild(child) {
    const C = this.children;
    let i;

    // if this child is not found, Widget.removeChild will generate an
    // error for us
    if (C !== null && (i = C.indexOf(child)) !== -1) {
      this.hidden_children.splice(i, 1);
    }

    super.removeChild(child);
  }

  enableDrawChildren() {
    const C = this.children;
    const H = this.hidden_children;
    if (C) for (let i = 0; i < C.length; i++) if (!H[i]) C[i].enableDraw();
  }

  disableDrawChildren() {
    const C = this.children;
    const H = this.hidden_children;
    if (C) for (let i = 0; i < C.length; i++) if (!H[i]) C[i].disableDraw();
  }

  /**
   * Starts the transition of the <code>visible</code> to <code>false</code>.
   *
   * @method Container#hide
   *
   */
  hide() {
    if (this.hidden()) return;
    this.update('visible', this.transitionsDisabled() ? false : 'hiding');
  }

  forceHide() {
    this.set('visible', false);
    const E = this.element;
    addClass(E, 'aux-hide');
    removeClass(E, 'aux-show', 'aux-hiding', 'aux-showing');
    this.disableDraw();
  }

  /**
   * Starts the transition of the <code>visible</code> to <code>true</code>.
   *
   * @method Container#show
   *
   */
  show() {
    if (!this.isDrawn()) this.enableDraw();
    if (!this.hidden()) return;

    this.update('visible', this.transitionsDisabled() ? true : 'showing');
  }

  forceShow() {
    const E = this.element;
    this.set('visible', true);
    addClass(E, 'aux-show');
    removeClass(E, 'aux-hide', 'aux-hiding', 'aux-showing');
  }

  /**
   * Switches the hidden state of a child to <code>hidden</code>.
   * The argument is either the child index or the child itself.
   *
   * @method Container#hideChild
   * @param {Object|integer} child - Child or its index.
   *
   */
  hideChild(i) {
    const C = this.children;
    const H = this.hidden_children;

    if (typeof i !== 'number') {
      i = C.indexOf(i);
    }

    const child = C[i];

    if (!child) throw new Error('Cannot find child.');

    if (H[i]) return;

    H[i] = true;

    if (this.isDrawn() && child.isDrawn()) {
      child.hide();
    } else {
      child.forceHide();
    }
  }

  /**
   * Switches the hidden state of a child to <code>shown</code>.
   * The argument is either the child index or the child itself.
   *
   * @method Container#showChild
   * @param {Object|integer} child - Child or its index.
   *
   */
  showChild(i) {
    const C = this.children;
    const H = this.hidden_children;

    if (typeof i !== 'number') {
      i = C.indexOf(i);
    }

    const child = C[i];

    if (!child) throw new Error('Cannot find child.');

    if (!H[i]) return;

    H[i] = false;

    if (this.isDrawn()) {
      child.show();
    } else {
      child.showNoDraw();
    }
  }

  /**
   * Returns true if the given child is currently marked as hidden in this
   * container.
   *
   * @param {number|Widget} child
   * @returns {boolean}
   */
  isChildHidden(child) {
    const C = this.children;
    const index = typeof child === 'number' ? child : C.indexOf(child);

    if (index < 0 || index >= C.length) throw new Error('Cannot find child.');

    return this.hidden_children[index];
  }

  /**
   * Toggles the hidden state of a child.
   * The argument is either the child index or the child itself.
   *
   * @method Container#toggleChild
   * @param {Object|integer} child - Child or its index.
   *
   */
  toggleChild(i) {
    const C = this.children;
    const H = this.hidden_children;

    if (typeof i !== 'number') {
      i = C.indexOf(i);
      if (i === -1) throw new Error('Cannot find child.');
    }
    if (H[i]) this.showChild(i);
    else this.hideChild(i);
  }

  visibleChildren(a) {
    if (!a) a = [];
    const C = this.children;
    const H = this.hidden_children;
    if (C)
      for (let i = 0; i < C.length; i++) {
        if (H[i]) continue;
        a.push(C[i]);
        C[i].visibleChildren(a);
      }
    return a;
  }

  hidden() {
    const state = this.options.visible;
    return super.hidden() || state === 'hiding';
  }

  draw(O, element) {
    addClass(element, 'aux-container');
    addClass(element, 'aux-show');

    super.draw(O, element);
  }
}
