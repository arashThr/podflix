const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema({
    epKey: String,
    fileId: String,
    fileName: String,
    caption: { type: String, default: '' },
    size: Number
})

const FileModel = mongoose.model('Files', fileSchema)
module.exports = FileModel
