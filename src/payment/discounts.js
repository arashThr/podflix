const fs = require('fs')
const path = require('path')

const logger = require('../logger')
const DiscountModel = require('../models/discountModel')
const { FreeUserModel } = require('../models/userModel')

async function applyDiscount(chatId, code) {
    const alreadyApplied = await DiscountModel.findOne({ chatId })
    if (alreadyApplied) return { reason: 'code alreay applied' }
    try {
        const discounts = readPromoCodes()
        const discount = discounts.find(d => d.code === code)
        if (!discount) {
            return { reason: 'code does not exist' }
        }
        if (await isExceedingAvailableCodes(discount)) {
            return { reason: 'code is no longer' }
        }
        const result = await saveDiscountForUser(discount, chatId)
        return {
            discountId: result._id, isFree: isFreeAccessCode(discount)
        }
    } catch (err) {
        logger.error('Proccessing discount file failed', { err })
        return { reason: 'code: Error occured' }
    }
}

async function addFreeUser(user, discountId) {
    user.discountId = discountId
    await FreeUserModel.create(user)
}

function isFreeAccessCode(discount) {
    if (discount.dollarPrice !== 0) return false
    if (discount.toomanPrice !== 0) {
        throw new Error('Promo code error: They both must be zero')
    }
    return true
}

async function saveDiscountForUser(discount, chatId) {
    const result = await DiscountModel.create({
        chatId,
        code: discount.code,
        dollarPrice: discount.dollarPrice,
        toomanPrice: discount.toomanPrice
    })
    return result._id
}

async function isExceedingAvailableCodes(discount) {
    if (discount.times === '*') return false
    const times = await DiscountModel.countDocuments({ code: discount.code })
    return times >= Number(discount.times)
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
        const pat = /^(?<dollar>\d{1,4})\$\s(?<tooman>\d{1,5})T\s(?<times>\d{1,5}|\*)\s(?<code>\w{4,20})$/g
        const result = pat.exec(l)
        if (result) {
            discounts.push({
                dollarPrice: Number(result.groups.dollar),
                toomanPrice: Number(result.groups.tooman),
                times: result.groups.times,
                code: result.groups.code
            })
        }
    }
    return discounts
}

async function savePaymentDiscountFor(chatId, payId) {
    return DiscountModel.updateOne(
        { chatId },
        {
            $set: {
                payId
            }
        }
    )
}

function findDiscountFor(chatId) {
    return DiscountModel.findOne({ chatId })
}

module.exports = {
    applyDiscount,
    savePaymentDiscountFor,
    findDiscountFor,
    addFreeUser
}
