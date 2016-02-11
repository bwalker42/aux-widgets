"use strict";

/** @namespace TK
 * 
 * @description This is the namespace of the toolkit library.
 * It contains all toolkit classes and constant.
 * There are also a couple of utility functions which provide
 * compatibility for older browsers.
 */
var TK;

(function(w) {

var has_class, add_class, remove_class, toggle_class;
// IE9
function get_class_name(e) {
  if (HTMLElement.prototype.isPrototypeOf(e)) {
      return e.className;
  } else {
      return e.getAttribute("class") || "";
  }
}
function set_class_name(e, s) {
  if (HTMLElement.prototype.isPrototypeOf(e)) {
      e.className = s;
  } else {
      e.setAttribute("class", s);
  }
}

if ('classList' in document.createElement("_") && 'classList' in make_svg('text')) {
  /** 
   * Returns true if the node has the given class.
   * @param {HTMLElement|SVGElement} node - The DOM node.
   * @param {string} name - The class name.
   * @returns {boolean}
   * @function TK.has_class
   */
  has_class = function (e, cls) { return e.classList.contains(cls); }
  /** 
   * Adds a CSS class to a DOM node.
   * @param {HTMLElement|SVGElement} node - The DOM node.
   * @param {string} name - The class name.
   * @function TK.add_class
   */
  add_class = function (e, cls) { e.classList.add(cls); }
  /** 
   * Removes a CSS class from a DOM node.
   * @param {HTMLElement|SVGElement} node - The DOM node.
   * @param {string} name - The class name.
   * @function TK.remove_class
   */
  remove_class = function (e, cls) { e.classList.remove(cls); }
  /** 
   * Toggles a CSS class from a DOM node.
   * @param {HTMLElement|SVGElement} node - The DOM node.
   * @param {string} name - The class name.
   * @function TK.remove_class
   */
  toggle_class = function (e, cls) { e.classList.toggle(cls); }
} else {
  has_class = function (e, cls) {
    return get_class_name(e).split(" ").indexOf(cls) !== -1;
  };
  add_class = function (e, cls) {
    var s = get_class_name(e);
    if (!s.length) {
      set_class_name(e, cls);
      return;
    }
    var a = s.split(" ");
    if (a.indexOf(cls) === -1) {
      a.push(cls);
      set_class_name(e,  a.join(" "));
    }
  };
  remove_class = function(e, cls) {
    var a = get_class_name(e).split(" ");
    var i = a.indexOf(cls);

    if (i !== -1) {
      do {
        a.splice(i, 1);
        i = a.indexOf(cls);
      } while (i !== -1);

      set_class_name(e, a.join(" "));
    }
  };
  toggle_class = function(e, cls) {
      if (has_class(e, cls)) {
          remove_class(e, cls);
      } else {
          add_class(e, cls);
      }
  };
}

var data_store;
var data;

if ('WeakMap' in w) {
    data = function(e) {
        var r;
        if (!data_store) data_store = new w.WeakMap();

        r = data_store[e];

        if (!r) {
            data_store[e] = r = {};
        }

        return r;
    };
} else {
    data_store = [];
    var data_keys = [];
    data = function(e) {
        if (typeof(e) !== "object") throw("Cannot store data for non-objects.");
        var k = data_keys.indexOf(e);
        var r;
        if (k == -1) {
            data_keys.push(e);
            k = data_store.push({}) - 1;
        }
        return data_store[k];
    };
}

var get_style;

if ('getComputedStyle' in w) {
  /** 
   * Returns the computed style of a node. 
   *
   * @param {HTMLElement|SVGElement} node - The DOM node.
   * @param {string} property - The CSS property name.
   * @returns {string}
   *
   * @function TK.get_style
   */
  get_style = function(e, style) {
    return document.defaultView.getComputedStyle(e).getPropertyValue(style);
  };
} else {
  get_style = function(e, style) {
    return e.currentStyle[style];
  };
}

function get_max_time(s) {
    var ret = 0, i, tmp;

    if (typeof(s) === "string") {
        s = s.split(",");
        for (i = 0; i < s.length; i++) {
            tmp = parseFloat(s[i]);

            if (tmp > 0) {
                if (-1 === s[i].search("ms")) tmp *= 1000;
                if (tmp > ret) ret = tmp;
            }
        }
    }

    return ret|0;
}

function get_duration(e) {
    return Math.max(get_max_time(get_style(e, "animation-duration"))
                  + get_max_time(get_style(e, "animation-delay")),
                    get_max_time(get_style(e, "transition-duration"))
                  + get_max_time(get_style(e, "transition-delay")));
}

function get_id(id) {
    return document.getElementById(id);
}
function get_class(cls, elm) {
    return (elm ? elm : document).getElementsByClassName(cls);
}
function get_tag(tag, elm) {
    return (elm ? elm : document).getElementsByTagName(tag);
}
function element(tag) {
    var n = document.createElement(tag);
    var i, v, j;
    for (i = 1; i < arguments.length; i++) {
        v = arguments[i]; 
        if (typeof v == "object") {
            set_styles(n, v);
        } else if (typeof v == "string") {
            add_class(n, v);
        } else throw("unsupported argument to TK.element");
    }
    return n;
}
function empty(e) {
    while (e.lastChild) e.removeChild(e.lastChild);
}
function set_text(node, s) {
    node.textContent = s;
}
function html(s) {
    /* NOTE: setting innerHTML on a document fragment is not supported */
    var e = document.createElement("div");
    var f = document.createDocumentFragment();
    e.innerHTML = s;
    while (e.lastChild) f.appendChild(e.lastChild);
    return f;
}
function set_content(node, s) {
    if (is_dom_node(s)) {
        empty(node);
        node.appendChild(s);
    } else {
        set_text(node, s + "");
    }
}
function insert_after(newn, refn) {
    if (refn.parentNode)
        refn.parentNode.insertBefore(newn, refn.nextSibling);
}
function insert_before(newn, refn) {
    if (refn.parentNode)
        refn.parentNode.insertBefore(newn, refn);
}
function width() {
    return Math.max(document.documentElement.clientWidth || 0, w.innerWidth || 0, document.body.clientWidth || 0);
}
function height() {
    return Math.max(document.documentElement.clientHeight, w.innerHeight || 0, document.body.clientHeight || 0);
}
function scroll_top(e) {
    if (e)
        return e.scrollTop;
    return Math.max(document.documentElement.scrollTop || 0, w.pageYOffset || 0, document.body.scrollTop || 0);
}
function scroll_left(e) {
    if (e)
        return e.scrollLeft;
    return Math.max(document.documentElement.scrollLeft, w.pageXOffset || 0, document.body.scrollLeft || 0);
}
function scroll_all_top(e) {
    var v = 0;
    while (e = e.parentNode) v += e.scrollTop || 0;
    return v;
}
function scroll_all_left(e) {
    var v = 0;
    while (e = e.parentNode) v += e.scrollLeft || 0;
    return v;
}
function position_top(e, rel) {
    var top    = parseInt(e.getBoundingClientRect().top);
    var f  = fixed(e) ? 0 : scroll_top();
    return top + f - (rel ? position_top(rel) : 0);
}
function position_left(e, rel) {
    var left   = parseInt(e.getBoundingClientRect().left);
    var f = fixed(e) ? 0 : scroll_left();
    return left + f - (rel ? position_left(rel) : 0);
}
function fixed(e) {
    return getComputedStyle(e).getPropertyValue("position") == "fixed";
}
function outer_width(element, margin, width) {
    var m = 0;
    if (margin) {
        var cs = getComputedStyle(element);
        m += parseFloat(cs.getPropertyValue("margin-left"));
        m += parseFloat(cs.getPropertyValue("margin-right"));
    }
    if (typeof width !== "undefined") {
        if (box_sizing(element) == "content-box") {
            var css = css_space(element, "padding", "border");
            width -= css.left + css.right;
        }
        width -= m;
        // TODO: fixme
        if (width < 0) return 0;
        element.style.width = width + "px";
        return width;
    } else {
        var w = element.getBoundingClientRect().width;
        return w + m;
    }
}
function outer_height(element, margin, height) {
    var m = 0;
    if (margin) {
        var cs = getComputedStyle(element, null);
        m += parseFloat(cs.getPropertyValue("margin-top"));
        m += parseFloat(cs.getPropertyValue("margin-bottom"));
    }
    if (typeof height !== "undefined") {
        if (box_sizing(element) == "content-box") {
            var css = css_space(element, "padding", "border");
            height -= css.top + css.bottom;
        }
        height -= m;
        // TODO: fixme
        if (height < 0) return 0;
        element.style.height = height + "px";
        return height;
    } else {
        var h = element.getBoundingClientRect().height;
        return h + m;
    }
}
function inner_width(element, width) {
    var css = css_space(element, "padding", "border");
    var x = css.left + css.right;
    if (typeof width !== "undefined") {
        if (box_sizing(element) == "border-box")
            width += x;
        // TODO: fixme
        if (width < 0) return 0;
        element.style.width = width + "px";
        return width;
    } else {
        var w = element.getBoundingClientRect().width;
        return w - x;
    }
}
function inner_height(element, height) {
    var css = css_space(element, "padding", "border");
    var y = css.top + css.bottom;
    if (typeof height !== "undefined") {
        if (box_sizing(element) == "border-box")
            height += y;
        // TODO: fixme
        if (height < 0) return 0;
        element.style.height = height + "px";
        return height;
    } else {
        var h = element.getBoundingClientRect().height;
        return h - y;
    }
}
function box_sizing(element) {
    var cs = getComputedStyle(element, null);
    if (cs.getPropertyValue("box-sizing")) return cs.getPropertyValue("box-sizing");
    if (cs.getPropertyValue("-moz-box-sizing")) return cs.getPropertyValue("-moz-box-sizing");
    if (cs.getPropertyValue("-webkit-box-sizing")) return cs.getPropertyValue("-webkit-box-sizing");
    if (cs.getPropertyValue("-ms-box-sizing")) return cs.getPropertyValue("-ms-box-sizing");
    if (cs.getPropertyValue("-khtml-box-sizing")) return cs.getPropertyValue("-khtml-box-sizing");
}
function css_space(element) {
    var cs = getComputedStyle(element, null);
    var o = {top: 0, right: 0, bottom: 0, left: 0};
    var a;
    var s;
    for (var i = 1; i < arguments.length; i++) {
        a = arguments[i];
        for (var p in o) {
            if (o.hasOwnProperty(p)) {
                s = a + "-" + p;
                if (a == "border") s += "-width";
            }
            o[p] += parseFloat(cs.getPropertyValue(s));
        }
    }
    return o;
}
function set_styles(elem, styles) {
    var key, v;
    var s = elem.style;
    for (key in styles) if (styles.hasOwnProperty(key)) {
        v = styles[key];
        if (typeof v !== "number" && !v) {
            delete s[key];
        } else {
            s[key] = (typeof v === "number") ? v + "px" : v;
        }
    }
}
function set_style(e, style, value) {
    if (typeof value === "number")
        value += "px";
    e.style[style] = value;
}
var _id_cnt = 0;
function unique_id() {
    var id;
    do { id = "tk-" + _id_cnt++; } while (document.getElementById(id));
    return id;
};

/** 
 * Generates formatting functions from sprintf-style format strings.
 * This is generally faster when the same format string is used many times.
 *
 * @returns {function} A formatting function.
 * @param {string} fmt - The format string.
 * @function TK.FORMAT
 * @example
 * var f = TK.FORMAT("%.2f Hz");
 * @see TK.sprintf
 */
function FORMAT(fmt) {
    var args = [];
    var s = "return ";
    var res;
    var last = 0;
    var argnum = 0;
    var precision;
    var regexp = /%(\.\d+)?([bcdefgosO%])/g;
    var argname;

    while (res = regexp.exec(fmt)) {
        if (argnum) s += "+";
        s += JSON.stringify(fmt.substr(last, regexp.lastIndex - res[0].length - last));
        s += "+";
        argname = "a"+argnum;
        if (args.indexOf(argname) == -1)
            args.push(argname);
        if (argnum+1 < arguments.length) {
            argname = "(" + sprintf(arguments[argnum+1].replace("%", "%s"), argname) + ")";
        }
        switch (res[2].charCodeAt(0)) {
        case 100: // d
            s += "("+argname+" | 0)";
            break;
        case 102: // f
            if (res[1]) { // length qualifier
                precision = parseInt(res[1].substr(1));
                s += "(+"+argname+").toFixed("+precision+")";
            } else {
                s += "(+"+argname+")";
            }
            break;
        case 115: // s
            s += argname;
            break;
        case 37:
            s += "\"%\"";
            argnum--;
            break;
        case 79:
            s += "JSON.stringify("+argname+")";
            break;
        default:
            throw("unknown format:"+res[0]);
            break;
        }
        argnum++;
        last = regexp.lastIndex;
    }

    if (argnum) s += "+";
    s += JSON.stringify(fmt.substr(last));

    return new Function(args, s);
}

/** 
 * Formats the arguments according to a given format string.
 *
 * @returns {function} A formatting function.
 * @param {string} fmt - The format string.
 * @param {...*} args - The format arguments.
 * @function TK.sprintf
 * @example
 * TK.sprintf("%d Hz", 440);
 * @see TK.FORMAT
 */
function sprintf(fmt) {
    var arg_len = arguments.length;
    var i, last_fmt;
    var c, arg_num = 1;
    var ret = [];
    var precision, s;
    var has_precision = false;

    for (last_fmt = 0; -1 !== (i = fmt.indexOf("%", last_fmt)); last_fmt = i+1) {
        if (last_fmt < i) {
            ret.push(fmt.substring(last_fmt, i));
        }

        i ++;

        if (has_precision = (fmt.charCodeAt(i) === 46 /* '.' */)) {
            i++;
            precision = parseInt(fmt.substr(i));
            while ((c = fmt.charCodeAt(i)) >= 48 && c <= 57) i++;
        }

        c = fmt.charCodeAt(i);

        if (c == 37) {
            ret.push("%");
            continue;
        }

        s = arguments[arg_num++];

        switch (fmt.charCodeAt(i)) {
        case 102: /* f */
            s = +s;
            if (has_precision) {
                s = s.toFixed(precision);
            }
            break;
        case 100: /* d */
            s = s|0;
            break;
        case 115: /* s */
            break;
        case 79: /* O */
            s = JSON.stringify(s);
            break;
        default:
            throw("Unsupported format.");
        }

        ret.push(s);

        last_fmt = i+1;
    }

    if (last_fmt < fmt.length) {
        ret.push(fmt.substring(last_fmt, fmt.length));
    }

    return ret.join("");
}

function escapeHTML(text) {
    var map = {
        '&' : '&amp;',
        '<' : '&lt;',
        '>' : '&gt;',
        '"' : '&quot;',
        "'" : '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function is_touch() {
    return 'ontouchstart' in w // works on most browsers 
      || 'onmsgesturechange' in w; // works on ie10
}
function os() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("android") > -1)
        return "Android";
    if (/iPad/i.test(ua) || /iPhone OS 3_1_2/i.test(ua) || /iPhone OS 3_2_2/i.test(ua))
        return "iOS";
    if ((ua.match(/iPhone/i)) || (ua.match(/iPod/i)))
        return "iOS";
    if (navigator.appVersion.indexOf("Win")!=-1)
        return "Windows";
    if (navigator.appVersion.indexOf("Mac")!=-1)
        return "MacOS";
    if (navigator.appVersion.indexOf("X11")!=-1)
        return "UNIX";
    if (navigator.appVersion.indexOf("Linux")!=-1)
        return "Linux";
}
function make_svg(tag, args) {
    // creates and returns an SVG object
    // 
    // arguments:
    // tag: the element to create as string, e.g. "line" or "g"
    // args: the options to set in the element
    // 
    // returns: the newly created object
    var el = document.createElementNS('http://www.w3.org/2000/svg', "svg:" + tag);
    for (var k in args)
        el.setAttribute(k, args[k]);
    return el;
}
function seat_all_svg(parent) {
    // searches all svg that don't have the class "fixed" and re-positions them
    // for avoiding blurry lines
    var a = get_tag("svg");
    for (var i = 0; i < a.length; i++) {
        if (!has_class(a[i], "svg-fixed"))
            seat_svg(a[i]);
    }
}
function seat_svg(e) {
    // move svgs if their positions in viewport is not int
    if (retrieve(e, "margin-left") === null) {
        store(e, "margin-left", parseFloat(get_style(e, "margin-left")));
    } else {
        e.style.marginLeft = retrieve(e, "margin-left");
    }
    var l = parseFloat(retrieve(e, "margin-left"));
    var b = e.getBoundingClientRect();
    var x = b.left % 1;
    if (x) {
        
        if (x < 0.5) l -= x;
        else l += (1 - x);
    }
    if (e.parentElement && get_style(e.parentElement, "text-align") == "center")
        l += 0.5;
    e.style.marginLeft = l + "px";
    if (retrieve(e, "margin-top") === null) {
        store(e, "margin-top", parseFloat(get_style(e, "margin-top")));
    } else {
        e.style.marginTop = retrieve(e, "margin-top");
    }
    var t = parseFloat(retrieve(e, "margin-top"));
    var b = e.getBoundingClientRect();
    var y = b.top % 1;
    if (y) {
        if (x < 0.5) t -= y;
        else t += (1 - y);
    }
    e.style.marginTop = t + "px";
}
function delayed_callback(timeout, cb, once) {
    var tid;
    var args;

    var my_cb = function() {
        tid = null;
        cb.apply(this, args);
    };
    return function() {
        args = Array.prototype.slice.call(arguments);

        if (tid)
            w.clearTimeout(tid);
        else if (once) once();
        tid = w.setTimeout(my_cb, timeout);
    };
}

function log2(n) {
    return Math.log(Math.max(1e-32, n)) / Math.LN2;
}
function log10(n) {
    return Math.log(Math.max(1e-32, n)) / Math.LN10;
}
function store(e, key, val) {
    data(e)[key] = val;
}
function retrieve(e, key) {
    return data(e)[key];
}
function merge(dst) {
    //console.log("merging", src, "into", dst);
    var key, i, src;
    for (i = 1; i < arguments.length; i++) {
        src = arguments[i];
        for (key in src) {
            dst[key] = src[key];
        }
    }
    return dst;
}
function object_and(orig, filter) {
    var ret = {};
    for (var key in orig) {
        if (filter[key]) ret[key] = orig[key];
    }
    return ret;
}
function object_sub(orig, filter) {
    var ret = {};
    for (var key in orig) {
        if (!filter[key]) ret[key] = orig[key];
    }
    return ret;
}
function is_dom_node(o) {
    /* this is broken for SVG */
    return typeof o === "object" && o instanceof Node;
}

// NOTE: IE9 will throw errors when console is used without debugging tools. In general, it
// is better for log/warn to silently fail in case of error. This unfortunately means that
// warnings might be lost, but probably better than having diagnostics and debugging code
// break an application

/**
 * Generates an error to the JavaScript console. This is virtually identical to console.error, however
 * it can safely be used in browsers which do not support it.
 * 
 * @param {...*} args
 * @function TK.error
 */
function error() {
    if (!w.console) return;
    try {
        w.console.error.apply(w.console, arguments);
    } catch(e) {}
}

/**
 * Generates a warning to the JavaScript console. This is virtually identical to console.warn, however
 * it can safely be used in browsers which do not support it.
 * 
 * @param {...*} args
 * @function TK.warn
 */
function warn() {
    if (!w.console) return;
    try {
        w.console.warn.apply(w.console, arguments);
    } catch(e) {}
}
/**
 * Generates a log message to the JavaScript console. This is virtually identical to console.log, however
 * it can safely be used in browsers which do not support it.
 * 
 * @param {...*} args
 * @function TK.log
 */
function log() {
    if (!w.console) return;
    try {
        w.console.log.apply(w.console, arguments);
    } catch(e) {}
}

TK = w.toolkit = {
    // ELEMENTS
    S: new DOMScheduler(),
    is_dom_node: is_dom_node,
    get_id: get_id,
    get_class: get_class,
    get_tag: get_tag,
    element : element,    
    empty: empty,
    set_text : set_text,
    set_content : set_content,
    has_class : has_class,
    remove_class : remove_class,
    add_class : add_class,
    toggle_class : toggle_class,
    
    insert_after: insert_after,
    insert_before: insert_before,
    
    // WINDOW
    
    width: width,
    height: height,
    
    // DIMENSIONS
    
    scroll_top: scroll_top,
    scroll_left: scroll_left,
    scroll_all_top: scroll_all_top,
    scroll_all_left: scroll_all_left,
    
    position_top: position_top,
    position_left: position_left,
    
    fixed: fixed,
    
    outer_width : outer_width,
    
    outer_height : outer_height,
    
    inner_width: inner_width,
    
    inner_height: inner_height,
    
    box_sizing: box_sizing,
    
    css_space: css_space,
    
    // CSS AND CLASSES
    
    set_styles : set_styles,
    set_style: set_style,
    get_style: get_style,
    get_duration: get_duration,
    
    // STRINGS
    
    unique_id: unique_id,
    
    FORMAT : FORMAT,
    
    sprintf : sprintf,
    html : html,
    
    escapeHTML : escapeHTML,
    
    // OS AND BROWSER CAPABILITIES
    
    is_touch: is_touch,
    os: os,
    
    browser: function () {
        var ua = navigator.userAgent, tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []; 
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || []; 
            return { name : 'IE', version : (tem[1]||'') };
        }   
        if (M[1] === 'Chrome') {
            tem = ua.match(/\bOPR\/(\d+)/)
            if (tem!=null)
                return { name : 'Opera', version : tem[1] };
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) { M.splice(1, 1, tem[1]); }
        return { name : M[0], version : M[1] };
    }(),
    
    // SVG
    
    make_svg: make_svg,
    seat_all_svg: seat_all_svg,
    seat_svg: seat_svg,
    
    
    // EVENTS
    
    delayed_callback : delayed_callback,
    
    // MATH
    
    log2: log2,
    log10: log10,
    
    // OTHER
    
    data: data,
    store: store,
    retrieve: retrieve,
    merge: merge,
    object_and: object_and,
    object_sub: object_sub,
    warn: warn,
    error: error,
    log: log,
};

// POLYFILLS

if (typeof Array.isArray === 'undefined') {
    Array.isArray = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }
};

if (typeof Object.assign === 'undefined') {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function() {
        this.parentNode.removeChild(this);
    };
}

// CONSTANTS

w._TOOLKIT_VARIABLE                    = "base";
w._TOOLKIT_VAR                         = "base";

// These constants exist here only for compatibility reasons
// POSITIONS
w._TOOLKIT_TOP                         = "top";
w._TOOLKIT_RIGHT                       = "right";
w._TOOLKIT_BOTTOM                      = "bottom";
w._TOOLKIT_LEFT                        = "left";
w._TOOLKIT_TOP_LEFT                    = "top-left";
w._TOOLKIT_TOP_RIGHT                   = "top-right";
w._TOOLKIT_BOTTOM_RIGHT                = "bottom-right";
w._TOOLKIT_BOTTOM_LEFT                 = "bottom-left";
w._TOOLKIT_CENTER                      = "center";

w._TOOLKIT_HORIZONTAL                  = "horizontal";
w._TOOLKIT_HORIZ                       = "horizontal";
w._TOOLKIT_VERTICAL                    = "vertical";
w._TOOLKIT_VERT                        = "vertical";

w._TOOLKIT_POLAR                       = "polar";

// DRAWING MODES
w._TOOLKIT_CIRCULAR                    = "circular";
w._TOOLKIT_CIRC                        = "circular";
w._TOOLKIT_LINE                        = "line";
w._TOOLKIT_LINE_HORIZONTAL             = "line-horizontal";
w._TOOLKIT_LINE_HORIZ                  = "line-horizontal";
w._TOOLKIT_LINE_VERTICAL               = "line-vertical";
w._TOOLKIT_LINE_VERT                   = "line-vertical";
w._TOOLKIT_LINE_X                      = "line-horizontal";
w._TOOLKIT_LINE_Y                      = "line-vertical";
w._TOOLKIT_BLOCK_LEFT                  = "block-left";
w._TOOLKIT_BLOCK_RIGHT                 = "block-right";
w._TOOLKIT_BLOCK_TOP                   = "block-top";
w._TOOLKIT_BLOCK_BOTTOM                = "block-bottom";
w._TOOLKIT_BLOCK_CENTER                = "block-center";

// SCALES
w._TOOLKIT_FLAT                        = "linear";
w._TOOLKIT_LINEAR                      = "linear";
w._TOOLKIT_LIN                         = "linear";

w._TOOLKIT_DECIBEL                     = "decibel";
w._TOOLKIT_DB                          = "decibel";
w._TOOLKIT_LOG2                        = "log2";

w._TOOLKIT_FREQUENCY                   = "frequency";
w._TOOLKIT_FREQ                        = "frequency";
w._TOOLKIT_FREQ_REVERSE                = "frequency-reverse";
w._TOOLKIT_FREQUENCY_REVERSE           = "frequency-reverse";

// FILTERS
w._TOOLKIT_PARAMETRIC                  = "parametric";
w._TOOLKIT_PARAM                       = "parametric";
w._TOOLKIT_PEAK                        = "parametric";
w._TOOLKIT_NOTCH                       = "notch";
w._TOOLKIT_LOWSHELF                    = "low-shelf";
w._TOOLKIT_LOSHELF                     = "low-shelf";
w._TOOLKIT_HIGHSHELF                   = "high-shelf";
w._TOOLKIT_HISHELF                     = "high-shelf";
w._TOOLKIT_LOWPASS_1                   = "lowpass1";
w._TOOLKIT_LOWPASS_2                   = "lowpass2";
w._TOOLKIT_LOWPASS_3                   = "lowpass3";
w._TOOLKIT_LOWPASS_4                   = "lowpass4";
w._TOOLKIT_LOPASS_1                    = "lowpass1";
w._TOOLKIT_LOPASS_2                    = "lowpass2";
w._TOOLKIT_LOPASS_3                    = "lowpass3";
w._TOOLKIT_LOPASS_4                    = "lowpass4";
w._TOOLKIT_LP1                         = "lowpass1";
w._TOOLKIT_LP2                         = "lowpass2";
w._TOOLKIT_LP3                         = "lowpass3";
w._TOOLKIT_LP4                         = "lowpass4";
w._TOOLKIT_HIGHPASS_1                  = "highpass1";
w._TOOLKIT_HIGHPASS_2                  = "highpass2";
w._TOOLKIT_HIGHPASS_3                  = "highpass3";
w._TOOLKIT_HIGHPASS_4                  = "highpass4";
w._TOOLKIT_HIPASS_1                    = "highpass1";
w._TOOLKIT_HIPASS_2                    = "highpass2";
w._TOOLKIT_HIPASS_3                    = "highpass3";
w._TOOLKIT_HIPASS_4                    = "highpass4";
w._TOOLKIT_HP1                         = "highpass1";
w._TOOLKIT_HP2                         = "highpass2";
w._TOOLKIT_HP3                         = "highpass3";
w._TOOLKIT_HP4                         = "highpass4";

// CIRULAR POSITIONS
w._TOOLKIT_INNER                       = "inner";
w._TOOLKIT_OUTER                       = "outer";

// WINDOWS
w._TOOLKIT_TITLE                       = "title";
w._TOOLKIT_CLOSE                       = "close";
w._TOOLKIT_MAX                         = "maximize";
w._TOOLKIT_MAXIMIZE                    = "maximize";
w._TOOLKIT_MAX_X                       = "maximize-horizontal";
w._TOOLKIT_MAX_HORIZ                   = "maximize-horizontal";
w._TOOLKIT_MAX_HORIZONTAL              = "maximize-horizontal";
w._TOOLKIT_MAXIMIZE_X                  = "maximize-horizontal";
w._TOOLKIT_MAXIMIZE_HORIZ              = "maximize-horizontal";
w._TOOLKIT_MAXIMIZE_HORIZONTAL         = "maximize-horizontal";
w._TOOLKIT_MAX_Y                       = "maximize-vertical";
w._TOOLKIT_MAX_VERT                    = "maximize-vertical";
w._TOOLKIT_MAX_VERTICAL                = "maximize-vertical";
w._TOOLKIT_MAXIMIZE_Y                  = "maximize-vertical";
w._TOOLKIT_MAXIMIZE_VERT               = "maximize-vertical";
w._TOOLKIT_MAXIMIZE_VERTICAL           = "maximize-vertical";
w._TOOLKIT_MINIMIZE                    = "minimize";
w._TOOLKIT_MIN                         = "minimize";
w._TOOLKIT_SHRINK                      = "shrink";
w._TOOLKIT_STATUS                      = "status";
w._TOOLKIT_RESIZE                      = "resize";

// UPDATE POLICY
w._TOOLKIT_CONTINUOUS                  = "continuous"

// ELEMENTS
w._TOOLKIT_ICON                        = "icon";
w._TOOLKIT_LABEL                       = "label";

// DYNAMICS
w._TOOLKIT_COMPRESSOR                  = "compressor";
w._TOOLKIT_UPWARD_COMPRESSOR           = "upward-compressor";
w._TOOLKIT_UPWARD_COMP                 = "upward-comp";
w._TOOLKIT_COMP                        = "compressor";
w._TOOLKIT_LIMITER                     = "limiter";
w._TOOLKIT_GATE                        = "gate";
w._TOOLKIT_NOISEGATE                   = "noise-gate";
w._TOOLKIT_EXPANDER                    = "expander";
w._TOOLKIT_EXP                         = "expander";

})(this);
