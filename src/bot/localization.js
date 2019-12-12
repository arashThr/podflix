const path = require('path')
const i18n = require('i18n')

const configs = require('../configs')

exports.i18nInit = () => {
    i18n.configure({
        directory: path.join(__dirname, 'locales'),
        objectNotation: true,
        register: global
    })

    i18n.setLocale(configs.botLang)
}
