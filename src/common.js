module.exports = class Commons {
    static get EP_NAME_LENGTH() {
        return 6
    }

    static get epNameRegex() {
        return new RegExp(`^\/(ep_[a-z0-9]{${Commons.EP_NAME_LENGTH}})$`)
    }

    static getUserFrom(tgUser) {
        return {
            chatId: tgUser.id,
            userName: tgUser.username,
            realName:
                [tgUser.first_name, tgUser.last_name].join(' ').trim() ||
                tgUser.username ||
                'Unknown'
        }
    }
}
