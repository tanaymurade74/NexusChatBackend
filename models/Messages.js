const mongoose = require("mongoose")


const messageSchema = new mongoose.Schema({
    sender:{
        type: String,
        required: true
    },
    receiver:{
        type: String,
        required: true
    },
    message:{
        type: String,
        required: true
    },

    status: { 
        type: String, 
        enum: ['sending', 'sent', 'delivered', 'read'], 
        default: 'sent' 
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Messages",
        default: null
    },
    editedAt:{
        type: Date,
        default: null
    },
    deletedAt:{
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("Messages", messageSchema);