module.exports = class Commons {
    static get EP_NAME_LENGTH() {
        return 6
    }

    static get epNameRegex() {
        return new RegExp(`^\/(ep_[a-z0-9]{${Commons.EP_NAME_LENGTH}})$`)
    }
}
