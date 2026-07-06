import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class EridianClockPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('Eridian Clock'),
            icon_name: 'preferences-system-time-symbolic',
        });

        const group = new Adw.PreferencesGroup({
            title: _('Clock Position'),
        });

        const positionModel = new Gtk.StringList();
        positionModel.append(_('Left'));
        positionModel.append(_('Right'));

        const positionRow = new Adw.ComboRow({
            title: _('Placement in top bar'),
            model: positionModel,
        });

        const updatePositionRow = () => {
            positionRow.selected = settings.get_string('position') === 'left' ? 0 : 1;
        };

        positionRow.connect('notify::selected', () => {
            settings.set_string('position', positionRow.selected === 0 ? 'left' : 'right');
        });

        settings.connect('changed::position', updatePositionRow);
        updatePositionRow();

        group.add(positionRow);
        page.add(group);
        window.add(page);
    }
}