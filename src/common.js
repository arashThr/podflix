const configs = require('./configs')

function toFarsiNumber(n) {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return n
        .toString()
        .split('')
        .map(x => {
            const n = parseInt(x)
            return isNaN(n) ? x : farsiDigits[n]
        })
        .join('')
}

const epNameLength = 6

module.exports = {
    EP_NAME_LENGTH: epNameLength,
    epNameRegex: new RegExp(`^\/(ep_[a-z0-9]{${epNameLength}})$`),
    ep0Key: 'ep0FileId',
    teaserKey: 'teaserFileId',

    paymentReturnPageInfo() {
        return {
            title: __('site.title'),
            successTitle: __('site.success-title'),
            successDesc: __('site.success-pay'),
            cancelTitle: __('site.canceled-title'),
            cancelDesc: __('site.canceled-pay'),
            goToBot: __('site.go-back-btn'),
            botUrl: `https://t.me/${configs.app.botUserName}`
        }
    },
    getUserFrom(tgUser) {
        return {
            chatId: tgUser.id,
            userName: tgUser.username,
            realName:
                [tgUser.first_name, tgUser.last_name].join(' ').trim() ||
                tgUser.username ||
                'Unknown'
        }
    },
    getToomanString(tooman) {
        if (tooman < 1000) return toFarsiNumber(tooman) + ' تومان'
        const t = String(tooman)
        const str = `${t.substr(0, t.length - 3)}٫${t.substr(
            t.length - 3
        )} تومان`
        return toFarsiNumber(str)
    },
    getDollarString(dollar) {
        if (dollar < 100) return dollar + ' دلار'
        const d = String(dollar)
        const str = `${d.substr(0, d.length - 2)}.${d.substr(
            d.length - 2
        )} دلار`
        return str
    }
}
