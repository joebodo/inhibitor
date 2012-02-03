/*
 * Based on presentationmode@travisman.com
 */

const DBus = imports.dbus;
const Lang = imports.lang;
const St = imports.gi.St;
const Gio = imports.gi.Gio;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const SessionIface = {
    name: "org.gnome.SessionManager",
    methods: [ 
    { name: "Inhibit", inSignature: "susu", outSignature: "u" },
    { name: "Uninhibit", inSignature: "u", outSignature: "" }
    ]
};
let SessionProxy = DBus.makeProxyClass(SessionIface);
let extensionPath;

function Inhibitor() {
	this._init({
		style_class: 'inhibitor' 
	});
}

Inhibitor.prototype = {
	 __proto__: PanelMenu.SystemStatusButton.prototype,

    _init: function() {

		this._sessionProxy = new SessionProxy(DBus.session,
				'org.gnome.SessionManager', '/org/gnome/SessionManager');

    	PanelMenu.SystemStatusButton.prototype._init.call(this, 
    			'system-lock-screen', 'Disable screensaver');
    	
    	this.actor.set_style('inhibitor-indicator');

    	this._inhibitedIcon = Gio.icon_new_for_string(
    			_(extensionPath + '/images/inhibited.svg'));
    	this._uninhibitedIcon = Gio.icon_new_for_string(
    			_(extensionPath + '/images/uninhibited.svg'));
        this.setGIcon(this._uninhibitedIcon);
    	this._iconActor.set_style('inhibitor-indicator');

		this.connect("clicked", Lang.bind(this, this._onButtonPress));

        this._inhibited = false;
    },
	
	_onInhibit : function(token) {
		global.log("setting token: " + token);
		this.token = token;
	},

	_onButtonPress : function(actor, event) {

		this._inhibited = !this._inhibited;
		if (this._inhibited) {
//			this.setIcon('audio-volume-medium');
//            this._iconActor.add_style_pseudo_class('checked');
	        this.setGIcon(this._inhibitedIcon);
	    	this.setTooltip('Enable screensaver');

	        try {
				global.log("inhibiting");
				this._sessionProxy.InhibitRemote("presentor", 0,
						"Presentation mode", 9, Lang.bind(this,
								this._onInhibit));
				Main.notify(_("Inhibitor"),
						_("Your screensaver is now disabled."));
			} catch (e) {
				global.log("Error: " + e.message);
			}
		} else {

//            this._iconActor.remove_style_pseudo_class('checked');
//			this.setIcon('audio-volume-muted');
	        this.setGIcon(this._uninhibitedIcon);
	    	this.setTooltip('Disable screensaver');
			global.log("uninhibiting with : " + this.token);
			this._sessionProxy.UninhibitRemote(this.token);
			Main.notify(_("Inhibitor"),
					_("Your screensaver is now re-enabled."));
		}
	}
};

function init(extensionMeta) {
	extensionPath = extensionMeta.path;
}

let inhibitor;

function enable() {

    inhibitor = new Inhibitor();
    let _children = Main.panel._leftBox.get_children();
    Main.panel._rightBox.insert_actor(inhibitor.actor, _children.length - 1);
}

function disable() {
	Main.panel._rightBox.remove_actor(inhibitor.actor);
	inhibitor.destroy();
}
