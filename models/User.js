const crypto = require('crypto')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const ErrorResponse = require('../utils/errorResponse')
const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: true,
        unique: [true, 'Email is required']
    },
    password: {
        type: String,
        required: [true, ' Password is required'],
        minlength: 5
    },
    date: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
})

UserSchema.pre('save' , async function() {
    const user = this
    if (user.isModified('password')){
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(user.password , salt)
    }
})

UserSchema.statics.getVerifiedUserFromToken = async function(token){
    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRECT)
        const user = await this.findById(decoded._id)
        return user
    } catch (error) {
        throw new ErrorResponse('Not authorize for this route : invalid token' , 401)
    }
}
UserSchema.methods.getJWTToken = function() {
    return jwt.sign({_id: this._id} , process.env.JWT_SECRECT , {
        expiresIn: process.env.JWT_EXPIRE
    })
}


UserSchema.methods.matchPassword = async function(password){
    return await bcrypt.compare(password , this.password)
}


// Create password reset token
UserSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex')
  
    // Encrypt token
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
  
    // Set expire to 10 mins
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000
  
    return resetToken
}
  
module.exports = mongoose.model('User', UserSchema)