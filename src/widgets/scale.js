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

/* jshint -W018 */

import { defineClass, defineChildElement } from '../widget_helpers.js';
import { Widget } from './widget.js';
import {
  rangedOptionsDefaults,
  rangedOptionsTypes,
  makeRanged,
} from '../utils/make_ranged.js';
import {
  setContent,
  addClass,
  outerWidth,
  outerHeight,
  element,
  removeClass,
  toggleClass,
  empty,
  innerHeight,
  innerWidth,
} from '../utils/dom.js';
import { FORMAT } from '../utils/sprintf.js';
import { warn } from '../utils/log.js';
import { S } from '../dom_scheduler.js';

function getBase(O) {
  return Math.max(Math.min(O.max, O.base), O.min);
}
function vert(O) {
  return O.layout === 'left' || O.layout === 'right';
}
function fillInterval(transformation, steps, i, from, to, min_gap, result) {
  const to_pos = transformation.valueToPixel(to);
  const from_pos = transformation.valueToPixel(from);

  if (Math.abs(to_pos - from_pos) < min_gap) return;

  if (!result)
    result = {
      values: [],
      positions: [],
    };

  const values = result.values;
  const positions = result.positions;
  const displayStep = Math.sign(to_pos - from_pos) * Math.max(1, min_gap);

  const step = from > to ? -steps[i] : steps[i];

  let lastPos = from_pos;
  let lastValue = from;

  for (let x = from + step; Math.sign(to - x) === Math.sign(step); ) {
    const pos = transformation.valueToPixel(x);
    const diff = Math.abs(lastPos - pos);
    if (Math.abs(to_pos - pos) < min_gap) break;
    if (diff >= min_gap) {
      if (i > 0 && diff >= min_gap * 2) {
        // we have a chance to fit some more labels in
        fillInterval(
          transformation,
          steps,
          i - 1,
          lastValue,
          x,
          min_gap,
          result
        );
      }
      values.push(x);
      positions.push(pos);
      lastPos = pos;
      lastValue = x;
      x += step;
    } else {
      const nextValue = transformation.pixelToValue(lastPos + displayStep);

      x += Math.ceil((nextValue - x) / step) * step;
    }
  }

  if (i > 0 && Math.abs(lastPos - to_pos) >= min_gap * 2) {
    fillInterval(transformation, steps, i - 1, lastValue, to, min_gap, result);
  }

  return result;
}

function binaryContains(list, value) {
  const length = list.length;
  if (length === 0 || !(value >= list[0]) || !(value <= list[length - 1]))
    return false;

  for (let start = 0, end = length - 1; start <= end; ) {
    const mid = start + ((end - start) >> 1);
    const pivot = list[mid];

    if (value === pivot) return true;

    if (value < pivot) {
      end = mid - 1;
    } else {
      start = mid + 1;
    }
  }

  return false;
}

// remove collisions from a with b given a minimum gap
function removeCollisions(a, b, min_gap, vert) {
  const pa = a.positions,
    pb = b.positions;
  const va = a.values;
  let dim;

  min_gap = +min_gap;

  if (typeof vert === 'boolean') dim = vert ? b.height : b.width;

  if (!(min_gap > 0)) min_gap = 1;

  if (!pb.length) return a;

  let i, j;
  const values = [];
  const positions = [];
  let pos_a, pos_b;
  let size;

  let last_pos = +pb[0],
    last_size = min_gap;

  if (dim) last_size += +dim[0] / 2;

  // If pb is just length 1, it does not matter
  const direction = pb.length > 1 && pb[1] < last_pos ? -1 : 1;

  for (i = 0, j = 0; i < pa.length && j < pb.length; ) {
    pos_a = +pa[i];
    pos_b = +pb[j];
    size = min_gap;

    if (dim) size += dim[j] / 2;

    if (
      Math.abs(pos_a - last_pos) < last_size ||
      Math.abs(pos_a - pos_b) < size
    ) {
      // try next position
      i++;
      continue;
    }

    if (j < pb.length - 1 && (pos_a - pos_b) * direction > 0) {
      // we left the current interval, lets try the next one
      last_pos = pos_b;
      last_size = size;
      j++;
      continue;
    }

    values.push(+va[i]);
    positions.push(pos_a);

    i++;
  }

  return {
    values: values,
    positions: positions,
  };
}
function createDOMNodes(data, create) {
  const nodes = [];
  const E = this.element;

  data.nodes = nodes;
  const values = data.values;
  const positions = data.positions;

  for (let i = 0; i < values.length; i++) {
    const node = create(values[i], positions[i]);
    nodes.push(node);
    E.appendChild(node);
  }
}
function createLabel(value, position) {
  const O = this.options;
  const elem = document.createElement('SPAN');
  elem.className = 'aux-label';
  if (vert(O)) {
    elem.style.bottom = (position / O.basis) * 100 + '%';
  } else {
    elem.style.left = (position / O.basis) * 100 + '%';
  }

  setContent(elem, O.labels(value));

  if (getBase(O) === value) addClass(elem, 'aux-base');
  if (O.max === value) addClass(elem, 'aux-max');
  if (O.min === value) addClass(elem, 'aux-min');

  return elem;
}
function createDot(value, position) {
  const O = this.options;
  const elem = document.createElement('DIV');
  elem.className = 'aux-dot';

  if (O.layout === 'left' || O.layout === 'right') {
    elem.style.bottom = (position / O.basis) * 100 + '%';
  } else {
    elem.style.left = (position / O.basis) * 100 + '%';
  }

  if (getBase(O) === value) addClass(elem, 'aux-base');
  if (O.max === value) addClass(elem, 'aux-max');
  if (O.min === value) addClass(elem, 'aux-min');

  return elem;
}
function measureDimensions(data) {
  const nodes = data.nodes;
  const width = [];
  const height = [];

  for (let i = 0; i < nodes.length; i++) {
    width.push(outerWidth(nodes[i]));
    height.push(outerHeight(nodes[i]));
  }

  data.width = width;
  data.height = height;
}
function handleEnd(O, labels, i) {
  const node = labels.nodes[i];
  const v = labels.values[i];

  if (v === O.min) {
    addClass(node, 'aux-min');
  } else if (v === O.max) {
    addClass(node, 'aux-max');
  } else return;
}
function generateScale(from, to, include_from, show_to) {
  const O = this.options;
  let labels;

  if (O.show_labels || O.show_markers)
    labels = {
      values: [],
      positions: [],
    };

  let dots = {
    values: [],
    positions: [],
  };
  const is_vert = vert(O);
  let tmp;

  const transformation = O.transformation;

  if (include_from) {
    tmp = transformation.valueToPixel(from);

    if (labels) {
      labels.values.push(from);
      labels.positions.push(tmp);
    }

    dots.values.push(from);
    dots.positions.push(tmp);
  }

  let levels = O.levels;

  fillInterval(
    transformation,
    levels,
    levels.length - 1,
    from,
    to,
    O.gap_dots,
    dots
  );

  if (labels) {
    if (O.levels_labels) levels = O.levels_labels;

    fillInterval(
      transformation,
      levels,
      levels.length - 1,
      from,
      to,
      O.gap_labels,
      labels
    );

    tmp = transformation.valueToPixel(to);

    if (
      show_to ||
      Math.abs(tmp - transformation.valueToPixel(from)) >= O.gap_labels
    ) {
      labels.values.push(to);
      labels.positions.push(tmp);

      dots.values.push(to);
      dots.positions.push(tmp);
    }
  } else {
    dots.values.push(to);
    dots.positions.push(transformation.valueToPixel(to));
  }

  if (O.show_labels) {
    createDOMNodes.call(this, labels, createLabel.bind(this));

    if (labels.values.length && labels.values[0] === getBase(O)) {
      addClass(labels.nodes[0], 'aux-base');
    }
  }

  const render_cb = function () {
    let markers;

    if (O.show_markers) {
      markers = {
        values: labels.values,
        positions: labels.positions,
      };
      createDOMNodes.call(this, markers, createDot.bind(this));
      for (let i = 0; i < markers.nodes.length; i++)
        addClass(markers.nodes[i], 'aux-marker');
    }

    if (O.show_labels && labels.values.length > 1) {
      handleEnd(O, labels, 0);
      handleEnd(O, labels, labels.nodes.length - 1);
    }

    if (O.avoid_collisions && O.show_labels) {
      dots = removeCollisions(dots, labels, O.gap_dots, is_vert);
    } else if (markers) {
      dots = removeCollisions(dots, markers, O.gap_dots);
    }

    createDOMNodes.call(this, dots, createDot.bind(this));
  };

  if (O.show_labels && O.avoid_collisions)
    S.add(
      function () {
        measureDimensions(labels);
        S.add(render_cb.bind(this), 3);
      }.bind(this),
      2
    );
  else render_cb.call(this);
}
/**
 * Interface for dots passed to the `fixed_dots` option of `Scale`.
 * @interface ScaleDot
 * @property {number} value - The value where the dot is located at.
 * @property {string|string[]} [class] - An optional class for the generated
 *      `div.aux-dot` element.
 */
/**
 * Interface for labels passed to the `fixed_labels` option of `Scale`.
 * @interface ScaleLabel
 * @property {number} value - The value where the dot is located at.
 * @property {string|string[]} [class] - An optional class string for the generated
 *      `span.aux-label` element.
 * @property {string} [label] - The label string. If omitted, the
 *      `options.labels(value)` is used.
 */
/**
 * Scale can be used to draw scales. It is used in {@link Meter} and
 * {@link Fader}. Scale draws labels and markers based on its parameters
 * and the available space. Scales can be drawn both vertically and horizontally.
 * Scale mixes in {@link Ranged} and inherits all its options.
 *
 * @extends Widget
 *
 * @class Scale
 *
 * @param {Object} [options={ }] - An object containing initial options.
 *
 * @property {String} [options.layout="right"] - The layout of the Scale. <code>right</code> and
 *   <code>left</code> are vertical layouts with the labels being drawn right and left of the scale,
 *   respectively. <code>top</code> and <code>bottom</code> are horizontal layouts for which the
 *   labels are drawn on top and below the scale, respectively.
 * @property {Integer} [options.division=1] - Minimal step size of the markers.
 * @property {Array<Number>} [options.levels=[1]] - Array of steps for labels and markers.
 * @property {Number} [options.base=false]] - Base of the scale. If set to <code>false</code> it will
 *   default to the minimum value.
 * @property {Function} [options.labels=FORMAT("%.2f")] - Formatting function for the labels.
 * @property {Integer} [options.gap_dots=4] - Minimum gap in pixels between two adjacent markers.
 * @property {Integer} [options.gap_labels=40] - Minimum gap in pixels between two adjacent labels.
 * @property {Boolean} [options.show_labels=true] - If <code>true</code>, labels are drawn.
 * @property {Boolean} [options.show_max=true] - If <code>true</code>, display a label and a
 *   dot for the 'max' value.
 * @property {Boolean} [options.show_min=true] - If <code>true</code>, display a label and a
 *   dot for the 'min' value.
 * @property {Boolean} [options.show_base=true] - If <code>true</code>, display a label and a
 *   dot for the 'base' value.
 * @property {ScaleDot[]|number[]|Boolean} [options.fixed_dots] - This option can be used to specify fixed positions
 *   for the markers to be drawn at. <code>false</code> disables fixed dots.
 * @property {ScaleLabel[]|number[]|Boolean} [options.fixed_labels] - This option can be used to specify fixed positions
 *   for the labels to be drawn at. <code>false</code> disables fixed labels.
 * @property {Boolean} [options.show_markers=true] - If true, every dot which is located at the same
 *   position as a label has the <code>.aux-marker</code> class set.
 * @property {Number|Boolean} [options.pointer=false] - The value to set the pointers position to. Set to `false` to hide the pointer.
 * @property {Number|Boolean} [options.bar=false] - The value to set the bars height to. Set to `false` to hide the bar.
 */
export const Scale = defineClass({
  Extends: Widget,
  _options: Object.assign(
    {},
    Widget.prototype._options,
    rangedOptionsTypes,
    {
      layout: 'string',
      division: 'number',
      levels: 'array',
      levels_labels: 'array',
      base: 'number',
      labels: 'function',
      gap_dots: 'number',
      gap_labels: 'number',
      show_labels: 'boolean',
      show_min: 'boolean',
      show_max: 'boolean',
      show_base: 'boolean',
      fixed_dots: 'boolean|array',
      fixed_labels: 'boolean|array',
      avoid_collisions: 'boolean',
      show_markers: 'boolean',
      bar: 'boolean|number',
      pointer: 'boolean|number',
    }
  ),
  options: Object.assign({}, rangedOptionsDefaults, {
    layout: 'right',
    division: 1,
    levels: [1],
    base: false,
    labels: FORMAT('%.2f'),
    avoid_collisions: false,
    gap_dots: 4,
    gap_labels: 40,
    show_labels: true,
    show_min: true,
    show_max: true,
    show_base: true,
    show_markers: true,
    fixed_dots: false,
    fixed_labels: false,
    bar: false,
    pointer: false,
  }),
  initialize: function (options) {
    if (!options.element) options.element = element('div');
    Widget.prototype.initialize.call(this, options);
    /**
     * @member {HTMLDivElement} Scale#element - The main DIV element. Has class <code>.aux-scale</code>
     */
  },
  draw: function (O, element) {
    addClass(element, 'aux-scale');

    Widget.prototype.draw.call(this, O, element);
  },

  redraw: function () {
    Widget.prototype.redraw.call(this);

    const I = this.invalid;
    const O = this.options;
    const E = this.element;

    if (I.layout) {
      I.layout = false;
      removeClass(
        E,
        'aux-vertical',
        'aux-horizontal',
        'aux-top',
        'aux-bottom',
        'aux-right',
        'aux-left'
      );
      if (this._bar) {
        this._bar.style.removeProperty('top');
        this._bar.style.removeProperty('bottom');
        this._bar.style.removeProperty('left');
        this._bar.style.removeProperty('right');
        I.bar = true;
      }
      switch (O.layout) {
        case 'left':
          addClass(E, 'aux-vertical', 'aux-left');
          break;
        case 'right':
          addClass(E, 'aux-vertical', 'aux-right');
          break;
        case 'top':
          addClass(E, 'aux-horizontal', 'aux-top');
          break;
        case 'bottom':
          addClass(E, 'aux-horizontal', 'aux-bottom');
          break;
        default:
          warn('Unsupported layout setting:', O.layout);
      }
    }

    if (I.reverse) {
      /* NOTE: reverse will be validated below */
      toggleClass(E, 'aux-reverse', O.reverse);
    }

    if (this._bar && (I.bar || I.basis || I.base || I.reverse)) {
      /* NOTE: options will be validated below */
      const transformation = O.transformation;
      const tmpval = transformation.valueToPixel(O.snap_module.snap(O.bar));
      const tmpbase = transformation.valueToPixel(O.base);
      const min = Math.min(tmpval, tmpbase);
      const max = Math.max(tmpval, tmpbase);

      if (vert(O)) {
        this._bar.style.top = ((O.basis - max) / O.basis) * 100 + '%';
        this._bar.style.bottom = (min / O.basis) * 100 + '%';
      } else {
        this._bar.style.right = ((O.basis - max) / O.basis) * 100 + '%';
        this._bar.style.left = (min / O.basis) * 100 + '%';
      }
    }

    if (
      I.validate(
        'base',
        'show_base',
        'gap_labels',
        'min',
        'show_min',
        'division',
        'max',
        'show_markers',
        'fixed_dots',
        'fixed_labels',
        'levels',
        'basis',
        'scale',
        'reverse',
        'show_labels',
        'labels'
      )
    ) {
      empty(E);
      const fixedDots = O.fixed_dots;
      const fixedLabels = O.fixed_labels;

      if (fixedDots && fixedLabels) {
        const dotNodes = this._createDots(fixedDots);

        if (O.show_labels) {
          const labelNodes = this._createLabels(fixedLabels);

          if (O.show_markers) {
            this._highlightMarkers(fixedLabels, fixedDots, dotNodes);
          }

          labelNodes.forEach((node) => E.appendChild(node));
        }

        dotNodes.forEach((node) => E.appendChild(node));
      } else {
        const base = getBase(O);

        if (base !== O.max)
          generateScale.call(this, base, O.max, true, O.show_max);
        if (base !== O.min)
          generateScale.call(this, base, O.min, base === O.max, O.show_min);
      }

      {
        const _bar = this._bar;
        const _pointer = this._pointer;
        if (_bar) E.appendChild(_bar);
        if (_pointer) E.appendChild(_pointer);
      }
    }
  },
  _highlightMarkers(labels, dots, dotNodes) {
    labels = labels
      .map((args) => (typeof args === 'number' ? args : args.value))
      .sort((a, b) => a - b);

    for (let i = 0; i < dots.length; i++) {
      const value = typeof dots[i] === 'number' ? dots[i] : dots[i].value;

      if (!binaryContains(labels, value)) continue;

      addClass(dotNodes[i], 'aux-marker');
    }
  },
  _createDot(args) {
    const O = this.options;
    const node = document.createElement('DIV');

    addClass(node, 'aux-dot');

    let value;

    if (typeof args === 'number') {
      value = args;
    } else {
      value = args.value;

      const cl = args.class;

      if (typeof cl === 'string') {
        addClass(node, cl);
      } else if (Array.isArray(cl)) {
        for (let i = 0; i < cl.length; i++) addClass(node, cl[i]);
      }
    }

    const transformation = O.transformation;

    const position = transformation.valueToPixel(value);

    if (O.layout === 'left' || O.layout === 'right') {
      node.style.bottom = (position / O.basis) * 100 + '%';
    } else {
      node.style.left = (position / O.basis) * 100 + '%';
    }

    if (getBase(O) === value) addClass(node, 'aux-base');
    if (O.max === value) addClass(node, 'aux-max');
    if (O.min === value) addClass(node, 'aux-min');

    return node;
  },
  _createDots(values) {
    return values.map((value) => this._createDot(value));
  },
  _createLabel(args) {
    const O = this.options;
    const transformation = O.transformation;

    let position, label;

    const node = document.createElement('SPAN');

    addClass(node, 'aux-label');

    let value;

    if (typeof args === 'number') {
      value = args;
      position = transformation.valueToPixel(value);

      label = O.labels(value);
    } else {
      value = args.value;

      position = transformation.valueToPixel(value);

      const cl = args.class;

      if (typeof cl === 'string') {
        addClass(node, cl);
      } else if (Array.isArray(cl)) {
        for (let i = 0; i < cl.length; i++) addClass(node, cl[i]);
      }

      if (args.label === void 0) {
        label = O.labels(value);
      } else {
        label = args.label;
      }
    }

    if (vert(O)) {
      node.style.bottom = (position / O.basis) * 100 + '%';
    } else {
      node.style.left = (position / O.basis) * 100 + '%';
    }

    setContent(node, label);

    if (getBase(O) === value) addClass(node, 'aux-base');
    if (O.max === value) addClass(node, 'aux-max');
    if (O.min === value) addClass(node, 'aux-min');

    return node;
  },
  _createLabels(values) {
    return values.map((value) => this._createLabel(value));
  },
  resize: function () {
    Widget.prototype.resize.call(this);
    const O = this.options;

    const basis = vert(O)
      ? innerHeight(this.element)
      : innerWidth(this.element);
    this.update('basis', basis);
  },

  // GETTER & SETTER
  set: function (key, value) {
    Widget.prototype.set.call(this, key, value);
    switch (key) {
      case 'division':
      case 'levels':
      case 'labels':
      case 'gap_dots':
      case 'gap_labels':
      case 'show_labels':
        /**
         * Gets fired when an option the rendering depends on was changed
         *
         * @event Scale#scalechanged
         *
         * @param {string} key - The name of the option which changed the {@link Scale}.
         * @param {mixed} value - The value of the option.
         */
        this.emit('scalechanged', key, value);
        break;
    }
  },
});
makeRanged(Scale);

/**
 * @member {HTMLDivElement} Fader#_pointer - The DIV element of the pointer. It can be used to e.g. visualize the value set in the backend.
 */
defineChildElement(Scale, 'pointer', {
  show: false,
  toggle_class: true,
  option: 'pointer',
  draw_options: Object.keys(rangedOptionsTypes).concat(['pointer', 'basis']),
  draw: function (O) {
    if (this._pointer) {
      const transformation = O.transformation;
      const snap_module = O.snap_module;
      const tmp =
        transformation.valueToCoef(snap_module.snap(O.pointer)) * 100 + '%';
      if (vert(O)) {
        this._pointer.style.bottom = tmp;
      } else {
        this._pointer.style.left = tmp;
      }
    }
  },
});

/**
 * @member {HTMLDivElement} Fader#_bar - The DIV element of the bar. It can be used to e.g. visualize the value set in the backend or to draw a simple levelmeter.
 */
defineChildElement(Scale, 'bar', {
  show: false,
  toggle_class: true,
  option: 'bar',
});
