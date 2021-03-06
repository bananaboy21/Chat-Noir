const Command = require("../../framework/Command.js");
const ArgResolver = require("../../framework/ArgResolver.js");
const { MessageAttachment } = require("discord.js");

class Darken extends Command {

    constructor(...args) {
        super(...args, {
            runIn: ["text"],
            perms: ["ATTACH_FILES"],
            description: language => language.get("COMMAND_DARKEN_DESCRIPTION"),
            usage: "[member:member::all]",
            cooldown: 5
        });
    }

    async run(message, [member]) {
        if (!member) member = message.member;
        const body = await this.client.utils.idiotic("effects/darkness", `?avatar=${member.user.displayAvatarURL({ format: "png", size: 1024 })}&darkness=50`);
        await message.channel.send(new MessageAttachment(Buffer.from(body.data)));
    }

};

module.exports = Darken;