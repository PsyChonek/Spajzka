const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String
    },
    price: {
        required: true,
        type: Number
    },
    description: {
        required: true,
        type: String
    },
    image: {
        required: true,
        type: String
    },
    amount: {
        required: true,

        type: Number
    },
    isOnBuylist: {
        required: true,
        type: Boolean
    }
})

module.exports = mongoose.model('Item', itemSchema)