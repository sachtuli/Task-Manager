const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./create_task')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: {
      type: Number,
      default: 0,
      required: true,
      validate (val) {
        if (val < 0) {
          throw new Error('Age cannot be a negative number.')
        }
      }
    },
    place: { type: String },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      validate (val) {
        if (!validator.isEmail(val)) throw new Error('Email is invalid.')
      }
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
      validate (val) {
        if (val.toLowerCase().includes('password')) {
          throw new Error('Invalid Password')
        }
      }
    },
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ],
    avatar: {
      type: Buffer
    }
  },
  { timestamps: true }
)

userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
})

userSchema.methods.toJSON = function () {
  /// this method internally  calls JSON.stringify . Express by default will run this method
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.tokens
  delete userObject.avatar

  // await user.save()
  return userObject
}

userSchema.methods.generateAuthToken = async function () {
  const user = this
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
  user.tokens.push({ token })
  await user.save()

  return token
}

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email })
  if (!user) {
    const err = new Error('Login Failed!. No User Found')
    throw err
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    const err = new Error('Invalid Password')
    throw err
  }

  return user
}

// To set Middleware : Hash the PlainText password before saving.

userSchema.pre('save', async function (next) {
  const user = this
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

// Delete the Tasks when User is removed. Cascade Delete Operation

userSchema.pre('remove', async function (next) {
  const user = this
  await Task.deleteMany({ owner: user._id })
  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
