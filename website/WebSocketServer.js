const WebSocket = require("ws");

class WebSocketServer {
    
    constructor(website) {
        Object.defineProperty(this, "client", { value: website.client, writable: false });
        this.website = website;
        this.wss = null;
    }

    socketSend(socket, data) {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
    }

    start() {
        this.wss = new WebSocket.Server({ server: this.website.server });
        this.wss.on("error", error => {
            this.client.console.wtf(`[WSS] Error: ${error}`);
        });
        this.wss.on("connection", socket => {
            socket.guildId = null;
            socket.playerListeners = {
                start: null,
                pause: null,
                end: null,
                stuck: null,
                volume: null
            };
            socket.on("message", packet => {
                try { JSON.parse(packet); } catch { return socket.close(1009, "Invalid JSON payload."); }
                const { id, alive } = JSON.parse(packet);
                const player = this.client.audioManager.get(id);
                if (alive) return this.socketSend(socket, { alive: true, now: Date.now() });
                if (!this.client.guilds.get(id)) return this.socketSend(socket, {
                    type: "NO_GUILD",
                    id: null,
                    data: null
                });
                socket.guildId = id;
                if (player) return this.playerListener(socket, player, id);
                this.socketSend(socket, {
                    type: "NO_PLAYER",
                    id: null,
                    data: null
                });
                this.client.once("newPlayer", player => this.playerListener(socket, player, id));
            });
            socket.on("error", error => this.client.console.wtf(`[WS ERROR] ${error}`));
            socket.on("close", () => {
                const player = this.client.audioManager.get(socket.guildId);
                if (!player) return;
                for (const [event, listener] of Object.entries(socket.playerListeners)) {
                    player.removeListener(event, listener);
                }
            });
        });
        return this;
    }

    playerListener(socket, player, id) {
        this.socketSend(socket, {
            type: "PLAYER_INFO",
            id,
            data: {
                currentTrack: player.queue.length ? player.queue[0].toJSON() : null,
                currentQueue: player.queue.slice(1).length > 1 ? player.queue.slice(1).length.map(t => t.toJSON()) : null,
                position: player.playerState.currentPosition,
                volume: player.playerState.currentVolume
            }
        });
        socket.playerListeners.start = () => this.socketSend(socket, {
            type: "PLAYER_TRACK_START",
            id,
            data: {
                currentTrack: player.queue.length ? player.queue[0].toJSON() : null,
                currentQueue: player.queue.slice(1).length > 1 ? player.queue.slice(1).length.map(t => t.toJSON()) : null,
                position: player.playerState.currentPosition,
                volume: player.playerState.currentVolume
            }     
        });
        socket.playerListeners.pause = paused => {
            if (paused) {
                this.socketSend(socket, {
                    type: "PLAYER_PAUSE",
                    id,
                    paused
                });
            } else {
                this.socketSend(socket, {
                    type: "PLAYER_RESUME",
                    id,
                    paused
                });
            }
        };
        socket.playerListeners.end = endEvent => {
            if (endEvent.reason === "REPLACED") return this.socketSend(socket, {
                type: "PLAYER_TRACK_REPLACED",
                id,
                data: {
                    currentTrack: player.queue.length ? player.queue[0].toJSON() : null,
                    currentQueue: player.queue.slice(1).length > 1 ? player.queue.slice(1).length.map(t => t.toJSON()) : null,
                    position: player.playerState.currentPosition,
                    volume: player.playerState.currentVolume
                }
            });
            if (endEvent.reason === "FINISHED" && player.queue.length < 1) return this.socketSend(socket, {
                type: "PLAYER_QUEUE_FINISHED",
                id,
                data: null,
            });
        };
        socket.playerListeners.stuck = stuck => {
            this.socketSend(socket, {
                type: "PLAYER_STUCK",
                id,
                data: stuck
            });
        };
        socket.playerListeners.volume = (oldVolume, newVolume) => {
            this.socketSend(socket, {
                type: "VOLUME_CHANGE",
                id,
                data: { oldVolume, newVolume }
            });
        }
        player.on("start", socket.playerListeners.start.bind(this));
        player.on("pause", socket.playerListeners.pause.bind(this));
        player.on("end", socket.playerListeners.end.bind(this));
        player.on("stuck", socket.playerListeners.stuck.bind(this));
        player.on("volume", socket.playerListeners.volume.bind(this));
    }

}

module.exports = WebSocketServer;