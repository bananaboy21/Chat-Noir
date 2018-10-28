const { Event } = require("klasa");
const AudioManager = require("../utils/music/AudioManager.js");
const Website = require("../website/Website.js");
const { post } = require("superagent");
const { STATUS_CODES } = require("http");

class KlasaReady extends Event {

    async run() {
        const res = await post("https://accounts.spotify.com/api/token")
            .send({ grant_type: "client_credentials" })
            .set("Authorization", `Basic ${Buffer.from(`${this.client.config.spotify.id}:${this.client.config.spotify.secret}`).toString("base64")}`)
            .set("Content-Type", "application/x-www-form-urlencoded")
            .catch(e => { res = e.response; });
        if (res.status !== 200) this.client.spotifyToken = null;
        this.client.spotifyToken = res.body.access_token;
        res.status !== 200 ? 
            this.client.console.error(`Failed to get spotify authorization token: ${res.status} - ${STATUS_CODES[res.status]}`) :
            this.client.console.log(`Got spotify authorization token: ${res.body.access_token}`);
        this.client.user.setActivity(`${this.client.guilds.size} guilds! | r.help | v2`, { type: "WATCHING" });
        this.client.audioManager = new AudioManager(this.client);
        this.client.website = new Website(this.client);
        this.client.website.start();
        for (const node of this.client.audioManager) {
            node.on("ready", () => this.client.console.log(`AudioNode connected with host: ${n.host}`));
            node.on("error", error => this.client.console.error(`AudioNode failed to connect with host: ${n.host}. This node will not be used for audio.`));
        }
    }

}

module.exports = KlasaReady;