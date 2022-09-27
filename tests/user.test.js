const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/create_user')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const userOneId = new mongoose.Types.ObjectId()
const userOne = {
  _id: userOneId,
  name: 'Mike Hussey',
  email: 'mike_hus@exe.com',
  password: 'MikeHussey!@',
  tokens: [{
    token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
  }]
}

const invaliUser = {
  _id: userOneId,
  name: 'UnAuthorised User',
  email: 'uauser@gmail.com',
  password: 'dummypass!@',
  tokens: [{
    token: jwt.sign({ _id: userOneId }, 'dummy')
  }]
}

beforeEach(async () => {
  await User.deleteMany()
  await new User(userOne).save()
})

test('Should sign up a new User', async () => {
  const res = await request(app)
    .post('/users')
    .send({
      name: 'Roger Fedrer',
      email: 'roger.fedrer@atp.com',
      password: 'RogerTheGREAT'
    })
    .expect(201)

  const user = await User.findById(res.body.user._id)
  expect(user).not.toBeNull()
  expect(user.password).not.toBe('RogerTheGREAT')
})

test('Should Login Existing User', async () => {
  const response = await request(app)
    .post('/users/login')
    .send({
      email: userOne.email,
      password: userOne.password
    })
    .expect(200)

  const user = await User.findById(userOneId)
  expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should Not Login Non-Existent User', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: invaliUser.email,
      password: invaliUser.password
    })
    .expect(400)
})

test('It should get Profile to User', async () => {
  await request(app).get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('It should Not get Profile for Unauthenticated User', async () => {
  await request(app).get('/users/me')
    .set('Authorization', `Bearer ${invaliUser.tokens[0].token}`)
    .send()
    .expect(400)
})

test('It should delete the authenticated User', async () => {
  await request(app).delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

  const user = await User.findById(userOneId)
  expect(user).toBeNull()
})

test('It should not delete the Unauthenticated User', async () => {
  await request(app).delete('/users/me')
    .set('Authorization', `Bearer ${invaliUser.tokens[0].token}`)
    .send()
    .expect(400)
})

test('Should Upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.png')
    .expect(200)

  const user = await User.findById(userOneId)
  expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should Update Existing User', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      age: 40
    })
    .expect(200)

  const user = await User.findById(userOneId)
  expect(user.age).toBe(40)
})

test('Should not Update invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: 'France'
    })
    .expect(400)
})
