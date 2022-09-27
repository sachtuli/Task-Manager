const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/create_user')
const router = new express.Router()

/** We will set middleware for each individual route */
const auth = require('../middleware/auth')

router.post('/users', async (req, res) => {
  const user = new User(req.body)

  try {
    await user.save()
    const token = await user.generateAuthToken()
    res.status(201).send({ user, token })
  } catch (err) {
    res.status(400).send(err)
  }
})

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()
    res.send({ user, token })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save()
    res.status(200).send('Logout Successful')
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.status(200).send('Logout from all Active Sessions Successful')
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const upload = multer({
  //  dest: './src/avatars',  // to store data in filesystem
  limits: { fileSize: 1000000 }, // 1MB limit
  fileFilter (req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error('Only jpg/jpeg/png format supported.'))
    }
    cb(undefined, true)
  }
})

router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send('Image Upload Successful.')
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message })
  }
)

// router.get("/users", auth, async (req, res) => {
//   try {
//     const users = await User.find({})
//     res.status(200).send(users)
//   } catch (error) {
//     res.status(400).send(error)
//   }
// })

router.get('/users/me', auth, async (req, res) => {
  try {
    res.send(req.user)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age', 'place']
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  )

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid Update Request' })
  }
  try {
    // const _id = req.params.id
    // const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })
    const user = await req.user
    updates.forEach((update) => (user[update] = req.body[update]))
    await user.save()

    // if (!user) {
    //   res.status(404).send()
    // }
    res.send(user)
  } catch (error) {
    res.status(400).send(error)
  }
})

// router.get("/users/:id", async (req, res) => {
//   const _id = req.params.id
//   try {
//     const user = await User.findById({ _id })
//     if (user) res.status(200).send(user)
//     else throw Error(" User Id Not Found")
//   } catch (error) {
//     res.status(400).send(error)
//   }
// })

router.delete('/users/me', auth, async (req, res) => {
  try {
    // const _id = req.user._id
    // const user = await User.findByIdAndDelete(_id)

    //   if (!user) {
    //     res.status(404).send()
    //   }
    await req.user.remove()
    res.send(req.user)
  } catch (error) {
    res.status(400).send(error)
  }
})

/** User  Can delete its Profile Picture */
router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send('Profile Image Removed.')
},
(error, req, res, next) => {
  res.status(400).send({ error: error.message })
}
)

router.get('/users/:id/avatar', async (req, res) => { // http://localhost:3000/users/6329a0ae5dba38f98019aa68/avatar
  try {
    const user = await User.findById(req.params.id)
    if (!user || !user.avatar) throw new Error(' User Id Not Found')

    // res.set('Content-Type','image/png')
    res.send(user.avatar)
  } catch (error) {
    res.status(400).send(error.message)
  }
})

module.exports = router
