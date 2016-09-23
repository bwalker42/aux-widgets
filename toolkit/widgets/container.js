/*
 * This file is part of toolkit.
 *
 * toolkit is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * toolkit is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General
 * Public License along with this program; if not, write to the
 * Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA  02110-1301  USA
 */
"use strict";
(function(w){ 
function after_hiding() {
    this.__hide_id = false;
    if (this.options.display_state === "hiding")
        this.set("display_state", "hide");
}
function after_showing() {
    this.__hide_id = false;
    if (this.options.display_state === "showing")
        this.set("display_state", "show");
}
function enable_draw_self() {
    if (this._drawn) return;
    this._drawn = true;
    if (this.needs_redraw) {
        TK.S.add(this._redraw, 1);
    }
    this.fire_event("show");
}
function enable_draw_children() {
    var C = this.children;
    var H = this.hidden_children;
    for (var i = 0; i < C.length; i++) if (!H[i]) C[i].enable_draw();
}
function disable_draw_self() {
    if (!this._drawn) return;
    this._drawn = false;
    if (this.needs_redraw) {
        TK.S.remove(this._redraw, 1);
        TK.S.remove_next(this._redraw, 1);
    }
    this.fire_event("hide");
}
function disable_draw_children() {
    var C = this.children;
    var H = this.hidden_children;
    for (var i = 0; i < C.length; i++) if (!H[i]) C[i].disable_draw();
}
w.TK.Container = w.Container = $class({
    /**
     * TK.Container represents a <code>&lt;DIV></code> element.
     *
     * @class TK.Container
     * @extends TK.Widget
     *
     * @param {Object} options
     * @property {string|HTMLElement} options.content - The content of the container. It can either be
     *  a string which is interpreted as Text or a DOM node. Note that this options will remove all
     *  child nodes from the container element including those added via append_child.
     * @property {number} options.hiding_duration - The duration in ms of the hiding CSS
     *  transition/animation of this container. If this option is not set, the transition duration
     *  will be determined by the computed style, which can be rather
     *  expensive. Setting this option explicitly can therefore be an optimization.
     * @property {number} options.showing_duration - The duration in ms of the showing CSS
     *  transition/animation of this container.
     */
    _class: "Container",
    Extends: TK.Widget,
    _options: Object.assign(Object.create(TK.Widget.prototype._options), {
        content: "string",
        display_state: "string",
        hiding_duration: "int",
        showing_duration: "int",
    }),
    options: {
        display_state : "show",
    },
    initialize: function (options) {
        var E;
        TK.Widget.prototype.initialize.call(this, options);
        this.hidden_children = [];
        if (!(E = this.element)) this.element = E = TK.element("div");
        TK.add_class(E, "toolkit-container"); 
        this.widgetize(E, true, true, true);

        this.__after_hiding = after_hiding.bind(this);
        this.__after_showing = after_showing.bind(this);
        this.__hide_id = false;
        TK.add_class(E, "toolkit-show");
    },
    
    destroy: function () {
        this.element.remove();
        TK.Widget.prototype.destroy.call(this);
    },
    /**
     * Calls {@link TK.Container#append_child} for an array of widgets.
     *
     * @param {Array.<TK.Widget>} children - The child widgets to append.
     * @method TK.Container#append_children
     */
    append_children : function (a) {
        a.map(this.append_child, this);
    },
    /**
     * Appends <code>child.element</code> to the container element and
     * registers <code>child</code> as a child widget.
     *
     * @param {TK.Widget} child - The child widget to append.
     * @method TK.Container#append_child
     */
    append_child : function(child) {
        child.set("container", this.element);
        this.add_child(child);
    },
    set_parent : function(parent) {
        if (parent && !(parent instanceof TK.Container)) {
            TK.warn("Container %o should not be child of non-container %o", this, parent);
        }
        TK.Widget.prototype.set_parent.call(this, parent);
    },
    add_child : function(child) {
        var C = this.children;
        var H = this.hidden_children;
        TK.Widget.prototype.add_child.call(this, child);
        H.push(false);
    },
    remove_child : function(child) {
        var C = this.children;
        var H = this.hidden_children;
        var i = C.indexOf(child);
        child.parent = null;
        if (i !== -1) {
            C.splice(i, 1);
            H.splice(i, 1);
        }
    },
    enable_draw: function () {
        if (this._drawn) return;
        enable_draw_self.call(this);
        enable_draw_children.call(this);
    },
    disable_draw: function () {
        if (!this._drawn) return;
        disable_draw_self.call(this);
        disable_draw_children.call(this);
    },
    hide: function () {
        var O = this.options;
        if (O.display_state === "hide") return;
        disable_draw_children.call(this);
        enable_draw_self.call(this);
        if (O.display_state === "hiding") return;
        this.set("display_state", "hiding");
    },
    force_hide: function () {
        var O = this.options;
        if (O.display_state === "hide") return;
        this.disable_draw();
        var E = this.element;
        O.display_state = "hide";
        TK.add_class(E, "toolkit-hide");
        TK.remove_class(E, "toolkit-hiding");
        TK.remove_class(E, "toolkit-showing");
        TK.remove_class(E, "toolkit-show");
    },
    show: function() {
        var O = this.options;
        enable_draw_self.call(this);
        if (O.display_state === "show" || O.display_state === "showing") return;
        this.set("display_state", "showing");
    },
    force_show: function() {
        var O = this.options;
        if (O.display_state === "show") return;
        this.enable_draw();
        var E = this.element;
        O.display_state = "show";
        TK.add_class(E, "toolkit-show");
        TK.remove_class(E, "toolkit-hiding");
        TK.remove_class(E, "toolkit-showing");
        TK.remove_class(E, "toolkit-hide");
    },
    show_nodraw: function() {
        var O = this.options;
        if (O.display_state === "show") return;
        this.set("display_state", "show");

        var C = this.children;
        var H = this.hidden_children;
        var i;
        for (i = 0; i < C.length; i++) if (!H[i]) C[i].show_nodraw();
    },
    hide_nodraw: function() {
        var O = this.options;
        if (O.display_state === "hide") return;
        this.set("display_state", "hide");

        var C = this.children;
        var H = this.hidden_children;
        var i;
        for (i = 0; i < C.length; i++) if (!H[i]) C[i].hide_nodraw();
    },
    hide_child: function(i) {
        var C = this.children;
        var H = this.hidden_children;

        if (typeof i !== "number") {
            i = C.indexOf(i);
            if (i === -1) throw("Cannot find child.");
        }

        H[i] = true;
        C[i].hide();
    },

    show_child: function(i) {
        var C = this.children;
        var H = this.hidden_children;

        if (typeof i !== "number") {
            i = C.indexOf(i);
            if (i === -1) throw("Cannot find child.");
        }

        if (H[i]) {
            H[i] = false;
            if (this.is_drawn()) C[i].show();
            else C[i].show_nodraw();
        }
    },

    toggle_child: function(i) {
        var C = this.children;
        var H = this.hidden_children;

        if (typeof i !== "number") {
            i = C.indexOf(i);
            if (i === -1) throw("Cannot find child.");
        }
        if (H[i]) this.show_child(i);
        else this.hide_child(i);
    },

    visible_children: function(a) {
        if (!a) a = [];
        var C = this.children;
        var H = this.hidden_children;
        for (var i = 0; i < C.length; i++) {
            if (H[i]) continue;
            a.push(C[i]);
            C[i].visible_children(a);
        }
        return a;
    },

    hidden: function() {
        var state = this.options.display_state;
        return TK.Widget.prototype.hidden.call(this) || state === "hiding" || state === "hide";
    },

    redraw: function() {
        var O = this.options;
        var I = this.invalid;
        var E = this.element;

        TK.Widget.prototype.redraw.call(this);

        if (I.display_state) {
            var time;
            TK.remove_class(E, "toolkit-hiding");
            TK.remove_class(E, "toolkit-hide");
            TK.remove_class(E, "toolkit-showing");
            TK.remove_class(E, "toolkit-show");

            if (this.__hide_id) {
                w.clearTimeout(this.__hide_id);
                this.__hide_id = false;
            }

            switch (O.display_state) {
            case "hiding":
                TK.add_class(E, "toolkit-hiding");
                time = O.hiding_duration || TK.get_duration(E);
                if (time > 0) {
                    this.__hide_id = w.setTimeout(this.__after_hiding, time);
                    break;
                }
                O.display_state = "hide";
                TK.remove_class(E, "toolkit-hiding");
                /* FALL THROUGH */
            case "hide":
                TK.add_class(E, "toolkit-hide");
                disable_draw_self.call(this);
                break;
            case "showing":
                TK.add_class(E, "toolkit-showing");
                time = O.showing_duration || TK.get_duration(E);
                if (time > 0) {
                    this.__hide_id = w.setTimeout(this.__after_showing, time);
                    enable_draw_children.call(this);
                    break;
                }
                O.display_state = "show";
                TK.remove_class(E, "toolkit-showing");
                /* FALL THROUGH */
            case "show":
                TK.add_class(E, "toolkit-show");
                enable_draw_children.call(this);
                break;
            }
        }

        if (I.content) {
            I.content = false;
            TK.empty(E);

            if (O.content) TK.set_content(E, O.content);
        }
    },
});
})(this);
