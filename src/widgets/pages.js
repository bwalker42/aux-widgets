/*
 * This file is part of A.UX.
 *
 * A.UX is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * A.UX is distributed in the hope that it will be useful,
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
 * The event is emitted for the option <code>show</code>.
 *
 * @event Pages#useraction
 * 
 * @param {string} name - The name of the option which was changed due to the users action
 * @param {mixed} value - The new value of the option
 */
import { define_class } from '../widget_helpers.js';
import { add_class, remove_class, is_dom_node } from '../utils/dom.js';
import { warn } from '../utils/log.js';
import { Container } from './container.js';
import { ChildWidgets } from '../utils/child_widgets.js';

function on_page_set_active(value)
{
  const pages = this.parent;

  if (value)
  {
    const index = pages.get_pages().indexOf(this);
    pages.show_child(this);
    pages.update('show', index);
    /**
     * The page to show has changed.
     * 
     * @param {Page} page - The {@link Page} instance of the newly selected page.
     * @param {number} id - The ID of the page.
     * 
     * @event Pages#changed
     */
    pages.emit("changed", this, index);
  }
  else
  {
    pages.hide_child(this);
  }
}

function on_page_added(page, position)
{
  const pages = this.widget;

  page.add_class('aux-page');
  page.on('set_active', on_page_set_active);

  const current = pages.current();

  if (page.get('active'))
  {
    pages.set('show', position);
  }
  else
  {
    let show = pages.get('show');

    // if the current active page has been moved, we have to update the
    // show property
    if (show >= position && show >= 0 && show < this.getList().length - 1)
    {
      ++show;
    }

    // update all pages active option, possibly also that of the new page
    pages.set('show', show);
  }

  // the new page is active
  if (page.get('active'))
  {
    // we don't want any animation
    page.force_show();

    if (current && current !== page)
      current.force_hide();
  }
  else
  {
    page.force_hide();
  }

  /**
   * A page was added to the Pages.
   *
   * @event Pages#added
   * 
   * @param {Page} page - The {@link Page} which was added as a page.
   */
  pages.emit("added", page, position);
}

function on_page_removed(page, position)
{
  const pages = this.widget;

  page.remove_class('aux-page');
  page.off('set_active', on_page_set_active);

  const show = pages.get('show');
  const length = this.getList().length;

  if (position < show)
  {
    pages.set("show", show-1);
  }
  else if (position === show)
  {
    if (show < length)
    {
      // show the next page
      pages.set("show", show);
    }
    else if (length)
    {
      // show the previous page
      pages.set('show', show - 1);
    }
    else
    {
      pages.set('show', -1);
    }
  }
  /**
   * A page was removed from the Pages
   *
   * @event Pages#removed
   * 
   * @param {Page} page - The {@link Page} which was removed.
   * @param {number} index - The index at which the container was.
   */
  pages.emit("removed", page, position);
}

export const Pages = define_class({
    /**
     * Pages contains different pages ({@link Page}s) which can
     * be swiched via option.
     * 
     * @class Pages
     * 
     * @param {Object} [options={ }] - An object containing initial options.
     * 
     * @property {Array<Page|DOMNode|String>} [options.pages=[]] -
     *   An array of either an instance of {@link Page} (or derivate),
     *   a DOMNode or a string of HTML which gets wrapped in a new {@link Container}.
     * @property {Integer} [options.show=-1] - The page to show. Set to -1 to hide all pages.
     * @property {String} [options.animation="horizontal"] - The direction of the
     *   flip animation, either `horizontal` or `vertical`.
     * 
     * @extends Container
     * 
     * @example
     * var pages = new Pages({
     *  pages: [
     *   {
     *    content: document.createElement("span"),
     *   },
     *   {
     *    content: "<h1>Foobar</h1><p>Lorem ipsum dolor sit amet</p>",
     *   }
     *  ]
     * });
     */
    Extends: Container,
    _options: Object.assign(Object.create(Container.prototype._options), {
        direction: "string",
        pages:     "array",
        show:      "int",
        animation: "string",
    }),
    options: {
        direction: "forward",
        pages:     [],
        show:      -1,
        animation: "horizontal",
    },
    static_events: {
        set_show: function(value) {
          const list = this.pages.getList();

          for (let i = 0; i < list.length; i++)
          {
            const page = list[i];
            page.update('active', i === value);
          }
        },
    },
    
    initialize: function (options) {
        Container.prototype.initialize.call(this, options);
        /**
         * The main DIV element. Has the class <code>.aux-pages</code>.
         *
         * @member Pages#element
         */
        this.pages = new ChildWidgets(this, {
          filter: Page,
        });
        this.pages.on('child_added', on_page_added);
        this.pages.on('child_removed', on_page_removed);
    },
    
    initialized: function () {
        Container.prototype.initialized.call(this);
        this.add_pages(this.options.pages);
        this.set("show", this.options.show);
    },
    draw: function(O, element)
    {
      add_class(element, "aux-pages");

      Container.prototype.draw.call(this, O, element);
    },
    
    redraw: function () {
        Container.prototype.redraw.call(this);
        var O = this.options;
        var I = this.invalid;
        var E = this.element;

        if (I.direction) {
            I.direction = false;
            remove_class(E, "aux-forward", "aux-backward");
            add_class(E, "aux-" + O.direction);
        }
        
        if (I.animation) {
            I.animation = false;
            remove_class(E, "aux-vertical", "aux-horizontal");
            switch (O.animation) {
                case "vertical":
                    add_class(E, "aux-vertical");
                    break;
                case "horizontal":
                    add_class(E, "aux-horizontal");
                    break;
                default:
                    warn("Unsupported animation", O.animation);
            }
        }
        
        if (I.show) {
            I.show = false;
            const pages = this.get_pages();

            for (let i = 0; i < pages.length; i++)
            {
              const page = pages[i];

              if (i === O.show)
                  page.add_class("aux-active");
              else
                  page.remove_class("aux-active");
            }
        }
    },
    
    /**
     * Adds an array of pages.
     *
     * @method Pages#add_pages
     * 
     * @property {Array<Page|DOMNode|String>} [options.pages=[]] -
     *   An array of either an instance of {@link Page} (or derivate),
     *   a DOMNode or a string which gets wrapped in a new {@link Page}.
     * 
     * @example
     * var p = new Pages();
     * p.add_pages(['foobar']);
     * 
     */
    add_pages: function (pages) {
        for (var i = 0; i < pages.length; i++)
            this.add_page(pages[i]);
    },

    create_page: function(content, options)
    {
      if (typeof content === "string" || content === void(0))
      {
        if (!options) options = {}; 
        options.content = content;
        return new Page(options);
      }
      else if (is_dom_node(content))
      {
        if (content.tagName === 'TEMPLATE')
        {
          content = content.content.cloneNode(true);
        }

        if (content.remove)
          content.remove();

        if (!options) options = {}; 
        options.content = content;
        return new Page(options);
      }
      else if (content instanceof Page)
      {
        return content;
      }
      else
      {
        throw new TypeError('Unexpected argument type.');
      }
    },
    
    /**
     * Adds a {@link Page} to the pages and a corresponding {@link Button}
     *   to the pages {@link Navigation}.
     *
     * @method Pages#add_page
     *
     * @param {Page|DOMNode|String} content - The content of the page.
     *   Either an instance of a {@link Page} (or derivate) widget,
     *   a DOMNode or a string of HTML which gets wrapped in a new {@link Container}
     *   with optional options from argument `options`.
     * @param {integer|undefined} position - The position to add the new
     *   page to. If undefined, the page is added at the end.
     * @param {Object} [options={ }] - An object containing options for
     *   the {@link Page} to be added as page if `content` is
     *   either a string or a DOMNode.
     * @emits Pages#added
     */
    add_page: function (content, position, options) {
        const page = this.create_page(content, options);
        const pages = this.get_pages();
        const element = this.element;
        const length = pages.length;

        if (position !== void(0) && typeof(position) !== 'number')
          throw new TypeError('position: Argument must be a number.');

        if (!(position >= 0 && position < length))
        {
          element.appendChild(page.element);
        }
        else
        {
          element.insertBefore(page.element, pages[position].element);
        }

        if (page.parent !== this)
        {
          // if this page is a web component, the above appendChild would have
          // already triggered a call to add_child
          this.add_child(page);
        }

        return page;
    },
    /**
     * Removes a page from the Pages.
     * 
     * @method Pages#remove_page
     * 
     * @param {integer|Page} page - The container to remove. Either an
     *   index or the {@link Page} widget generated by <code>add_page</code>.
     * @param {Boolean} destroy - destroy the {@link Page} after removal.
     * 
     * @emits Pages#removed
     */
    remove_page: function (page, destroy)
    {
      let position = -1;

      if (page instanceof Page)
      {
        position = this.pages.indexOf(page);
      }
      else if (typeof page === 'number')
      {
        position = page;
        page = this.pages.at(position);
      }

      if (!page || position === -1)
        throw new Error('Unknown page.');

      this.element.removeChild(page.element);

      if (this.pages.at(position) === page)
      {
        // NOTE: if we remove a child which is a web component,
        // it will itself call remove_child
        this.remove_child(page);
      }

      if (destroy)
          page.destroy();
    },
    
    /**
     * Removes all pages.
     * 
     * @method Pages#empty
     */
    empty: function () {
        while (this.get_pages().length)
            this.remove_page(0);
    },

    current: function() {
        /**
         * Returns the currently displayed page or null.
         * 
         * @method Pages#current
         */
        return this.pages.at(this.options.show) || null;
    },

    /**
     * Opens the first page of the pages. Returns <code>true</code> if a
     * first page exists, <code>false</code> otherwise.
     *
     * @method Pages#first
     * 
     * @returns {Boolean} True if successful, false otherwise.
     */
    first: function() {
        if (this.get_pages().length) {
            this.set("show", 0);
            return true;
        }
        return false;
    },
    /**
     * Opens the last page of the pages. Returns <code>true</code> if a
     * last page exists, <code>false</code> otherwise.
     *
     * @method Pages#last
     * 
     * @returns {Boolean} True if successful, false otherwise.
     */
    last: function() {
        const length = this.get_pages().length;
        if (length) {
            this.set("show", length-1);
            return true;
        }
        return false;
    },

    /**
     * Opens the next page of the pages. Returns <code>true</code> if a
     * next page exists, <code>false</code> otherwise.
     *
     * @method Pages#next
     * 
     * @returns {Boolean} True if successful, false otherwise.
     */
    next: function() {
        const show = this.options.show;
        const length = this.get_pages().length;

        if (show + 1 < length)
        {
          this.set('show', show + 1);
          return true;
        }

        return false;
    },
    /**
     * Opens the previous page of the pages. Returns <code>true</code> if a
     * previous page exists, <code>false</code> otherwise.
     *
     * @method Pages#prev
     * 
     * @returns {Boolean} True if successful, false otherwise.
     */
    prev: function() {
        const show = this.options.show;
        const length = this.get_pages().length;

        if (show === 0)
          return false;

        this.set('show', show - 1);

        return show - 1 < length;
    },

    set: function (key, value) {
        if (key === "show")
        {
          if (value !== this.options.show)
          {
            if (value > this.options.show) {
                this.set("direction", "forward");
            } else {
                this.set("direction", "backward");
            }
          }
        }
        else if (key === 'pages')
        {
          this.options.pages.forEach((page) => this.remove_page(page, true));
          value = this.add_pages(value || []);
        }
        return Container.prototype.set.call(this, key, value);
    },
    get_pages: function() {
        return this.pages.getList();
    },
});

export const Page = define_class({
    /**
     * Page is the child widget to be used in {@link Pages}.
     * 
     * @class Page
     * 
     * @param {Object} [options={ }] - An object containing initial options.
     * 
     * @property {String} [options.label=""] - The label of the pages corresponding button
     * 
     * @extends Container
     */
    Extends: Container,
    _options: Object.assign(Object.create(Container.prototype._options), {
        label: "string",
    }),
    options: {
        label: "",
    }
});
