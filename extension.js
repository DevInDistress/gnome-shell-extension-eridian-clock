/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

const MILLIS_PER_ERIDIAN_SECOND = 2366;
const SECONDS_PER_ERIDIAN_DAY = 7776;

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('Eridian Clock'));

        this._label = new St.Label({
            text: getEridianTime(),
            style_class: 'clock-label',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._label);
    }

    refreshTime() {
        this._label.text = getEridianTime();
    }
});

export default class IndicatorExampleExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._settingsChangedId = this._settings.connectObject('changed::position', () => {
            this._rebuildIndicator();
        }, this);

        this._rebuildIndicator();
    }

    disable() {
        this._removeTimer();
        this._disconnectFromSettings();
        this._destroyUIElement();

    }

    _removeTimer() {
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = 0;
        }
    }

    _disconnectFromSettings() {
        if (this._settings) {
            this._settings.disconnectObject(this);
            this._settingsChangedId = 0;
        }
        this._settings = null;
    }

    _destroyUIElement() {
        if (this._indicator)
            this._indicator.destroy();

        this._indicator = null;
    }

    _rebuildIndicator() {
        const side = this._settings.get_string('position') === 'left' ? 'left' : 'right';
        const position = Main.sessionMode.panel[side].length;

        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = 0;
        }

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._indicator = new Indicator();

        Main.panel.addToStatusArea(this.uuid, this._indicator, position, side);

        this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, MILLIS_PER_ERIDIAN_SECOND, () => {
            if (this._indicator) {
                this._indicator.refreshTime();
                return GLib.SOURCE_CONTINUE;
            }
            return GLib.SOURCE_REMOVE;
        });
    }
}

function _convertDigit(number) {
    switch (number) {
    case 0:
        return 'ℓ';
    case 1:
        return 'I';
    case 2:
        return 'V';
    case 3:
        return 'λ';
    case 4:
        return '+';
    case 5:
        return '∀';
    default:
        return '?';
    }
}

function _getTime() {
    return Date.now();
}

function _getTimeAsEridianMillis() {
    return Math.floor(_getTime() / MILLIS_PER_ERIDIAN_SECOND) % SECONDS_PER_ERIDIAN_DAY;
}

function _toSenary(time) {
    let result = '';

    for (let i = 0; i < 5; i++) {
        const remainder = time % 6;
        result = _convertDigit(remainder) + result;
        time = Math.floor(time / 6);
    }

    return result;
}

function getEridianTime() {
    return _toSenary(_getTimeAsEridianMillis());
}
