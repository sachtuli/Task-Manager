/* eslint-disable camelcase */
const express = require('express')
const router = new express.Router()
const Task = require('../models/create_task')
const auth = require('../middleware/auth')

router.post('/tasks', auth, async (req, res) => {
  // const task = new Task(req.body)
  const task = new Task({ ...req.body, owner: req.user._id })
  try {
    await task.save()
    res.status(201).send(task)
  } catch (err) {
    res.status(400).send(err)
  }
})

/// Get the tasks based on completed.
// Pagination and Skip.
router.get('/tasks', auth, async (req, res) => {
  const match = {}
  const sort = {}
  let tasks = []
  try {
    if (req.query.sort) {
      const parts = req.query.sort.split(':')
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    const tasks_res = await Task.find({ owner: req.user._id })
      .limit(parseInt(req.query.limit))
      .skip(parseInt(req.query.skip))
      .sort(sort)

    if (!tasks_res) {
      return res.status(400).send(tasks_res)
    }

    if (req.query.completed) {
      match.completed = req.query.completed === 'true'

      tasks = tasks_res.filter((task) => {
        return task.completed === match.completed
      })
    } else tasks = tasks_res

    return res.send(tasks)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id
  try {
    // const task = await Task.findById({ _id })
    const task = await Task.findOne({ _id, owner: req.user._id })
    if (!task) {
      return res.status(404).send()
    }
    res.send(task)
  } catch (error) {
    res.status(500).send(error)
  }
})

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['description', 'completed']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid Update Request' })
  }
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
    // const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })
    if (!task) {
      res.status(404).send()
    }
    updates.forEach((update) => (task[update] = req.body[update]))
    await task.save()
    res.send(task)
  } catch (error) {
    res.status(400).send(error)
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete({ _id: req.params.id, owner: req.user._id })
    if (!task) {
      throw new Error('Task Id not Found')
    }
    res.send(task)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

module.exports = router
