const Event = require("../framework/Event.js");
const AudioManager = require("../utils/music/AudioManager.js");
const Website = require("../website/Website.js");

class ReadyEvent extends Event {

    async run() {
        this.client.console.log(`${this.client.user.tag} ready in ${this.client.guilds.size} guilds!`);
        this.client.user.setActivity("cn.help | v2", { type: "PLAYING" });
        this.client.audioManager = new AudioManager(this.client);
        for (const node of [...this.client.audioManager.nodes.values()]) {
            node.on("ready", () => this.client.console.log(`AudioNode connected with host: ${node.host}`));
            node.on("error", () => this.client.console.error(`AudioNode failed to connect with host: ${node.host}.`));
        }
        this.client.website = new Website(this.client);
        this.client.website.start();
    }

}

module.exports = ReadyEvent;