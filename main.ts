import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as net from 'net'
import {readFileSync} from 'fs';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	serverAddress: string;
	serverPort: number;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	serverAddress : "192.168.1.197",
	serverPort: 3000
}

export default class SelfSyncPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));


		this.addRibbonIcon('download-cloud', 'Sync', () => {
		    // execute when icon clicked
		    // new Notice('Hello, world!');
		    this.sync()
		});


		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			//console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	sync() {
	    console.log("syncing")
	    const files = this.app.vault.getFiles()
	    console.log(files)
	    var buffer: Array<Object> = []
	    const client = net.connect(this.settings.serverPort, this.settings.serverAddress, () => {
		console.log("connected to server")

		files.forEach(file => {
		    buffer.push({"path": file.path, "name": file.name, "data": readFileSync(`${file.vault.adapter.basePath}/${file.path}`).toString()})
		})

		client.write(JSON.stringify(buffer))
		client.end()
	    })
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: SelfSyncPlugin;

	constructor(app: App, plugin: SelfSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
