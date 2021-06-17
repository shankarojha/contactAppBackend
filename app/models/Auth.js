const mongoose = require('mongoose')
const time = require('../libs/timeLib')

let authSchema = new mongoose.Schema({

    userId:{
        type:String,
        unique:true
    },

    authToken: {
        type:String
    },

    tokenSecret:{
        type:String
    },

    tokenGenerationTime:{
        type: Date,
        default: time.now()
    }
})

module.exports = mongoose.model('Auth', authSchema)