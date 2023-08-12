import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as net from 'net'
import {readFileSync, writeFileSync} from 'fs';
import { ensureDirSync } from 'fs-extra';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	serverAddress: string;
	serverPort: number;
	vaultPassword: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	serverAddress : "192.168.1.197",
	serverPort: 3000,
	vaultPassword: ""
}

export default class SelfSyncPlugin extends Plugin {
	settings: MyPluginSettings;
	connection: net.Socket;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.addRibbonIcon('refresh-ccw', 'Connect to sync', () => {
		    this.connectServer()
		});

		this.addRibbonIcon('download-cloud', 'Sync', () => {
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
	
	connectServer() {
	    if(this.connection){
		this.connection.end()
	    }
	    this.connection = net.connect(this.settings.serverPort, this.settings.serverAddress)

	    this.connection.on('connect', () => {
		console.log(`connected to ${this.connection.remoteAddress}:${this.connection.remotePort}`)
	    });

	    this.connection.on('data', buffer => {
		var response = JSON.parse(buffer.toString())
		console.log(response)
		if(response.mode == "update"){
		    console.log("updating")
		    
		    response.params.items.forEach((item: {path: String; name: String; data: String}) => {
			ensureDirSync(`${this.app.vault.adapter.basePath}/${item.path}`)
			writeFileSync(`${this.app.vault.adapter.basePath}/${item.path}/${item.name}`, item.data.toString())
		    })
		}
	    });
	}

	sync(){
	    this.syncUpload()
	}

	syncUpload() {
	    console.log("syncing...")
	    const files = this.app.vault.getFiles()
	    var buffer: {mode: String; params: {vaultName: String; items: Array<Object>};} = {mode:"upload", params: {vaultName: this.app.vault.getName(), items:[]}}
		
	    //client.write(JSON.stringify({mode: "syncStart"}))

	    files.forEach(file => {
		buffer.params.items.push({path: file.path.replace(file.name, ""), name: file.name, data: readFileSync(`${file.vault.adapter.basePath}/${file.path}`).toString()})
	    })

	    //client.write(JSON.stringify(buffer))
	    //client.end()

	    this.connection.write(JSON.stringify(buffer))
	}

	getServerData() {

	    const client = net.connect(this.settings.serverPort, this.settings.serverAddress, () => {
		console.log("connected to server")

		client.write(JSON.stringify({mode: "syncStart", params:{vaultName: this.app.vault.getName()}}))
		client.on('data', buffer => {

		})

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
