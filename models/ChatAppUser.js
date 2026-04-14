const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const UserSchema = new mongoose.Schema({
    username:{
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
});

UserSchema.methods.compare = async function (password){
    return bcrypt.compare(password, this.password);
}

const ChatAppUser = mongoose.model("ChatAppUser", UserSchema);

module.exports = ChatAppUser;