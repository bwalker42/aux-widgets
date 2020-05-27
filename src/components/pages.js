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

import {
  componentFromWidget,
  defineComponent,
  subcomponentFromWidget,
} from './../component_helpers.js';
import { Pages } from './../widgets/pages.js';

function addPage(pages, page) {
  pages.addPage(page);
}

function removePage(pages, page) {
  pages.removePage(page);
}

/**
 * WebComponent for the Pages widget. Available in the DOM as
 * `aux-pages`.
 *
 * @class PagesComponent
 * @implements Component
 */
export const PagesComponent = componentFromWidget(Pages);

defineComponent('pages', PagesComponent);
