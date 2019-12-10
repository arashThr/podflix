const { discountsCollection } = require('../db')
const fs = require('fs')
const path = require('path')

const logger = require('../logger')

async function applyDiscount(chatId, code) {
    const alreadyApplied = await discountsCollection().findOne({ chatId })
    if (alreadyApplied) {
        return false
    }
    try {
        const discounts = readPromoCodes()
        const discount = discounts.find(d => d.code === code)
        if (!discount) {
            return false
        }
        if (await isExceedingAvailableCodes(discount)) {
            return false
        }
        console.log('DIS: ', discount)
        return discount
    } catch (e) {
        logger.error('Proccessing discount file failed', e)
        return false
    }
}

function readPromoCodes() {
    const discountFilePath = path.join(process.cwd(), 'data', 'promo.txt')
    const discountFile = fs.readFileSync(discountFilePath, 'utf8')
    const lines = discountFile.split('\n')
    const discounts = []

    for (const line of lines) {
        const l = line.trim()
        if (l.startsWith('#') || l === '') {
            continue
        }
        const pat = /^(\d{1,3})%\s(\d+|\*)\s(\w{4,10})$/g
        const result = pat.exec(l)
        if (result) {
            discounts.push({
                precentage: result[1],
                times: result[2],
                code: result[3]
            })
        }
    }
    return discounts
}

exports.applyDiscount = applyDiscount
