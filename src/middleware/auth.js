const jwt = require('jsonwebtoken')
const User = require('../models/create_user')

/* Middleware Function that runs between requests and handler */

const auth = async (req, res, next) => {
  try {
    const token = req.header('authorization').replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

    if (!user) {
      throw new Error('Invalid User')
    }

    req.token = token
    req.user = user // storing the above result so that code doesn't need to find that again
    next()
  } catch (err) {
    res.status(400).send('Please Authenticate Yourself. Thank You!')
  }
}

module.exports = auth
