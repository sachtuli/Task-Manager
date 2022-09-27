/**  We are creating this file to run app
 * because we need supertest to do testing of our
 * application without running the application.
 */

/*
EXPRESS ROUTE HANDLER
*/

const express = require('express')
require('./db/mongoose')

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

module.exports = app
