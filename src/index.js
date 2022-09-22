/*
EXPRESS ROUTE HANDLER
*/

const express = require("express")
require("./db/mongoose")

const userRouter = require("./routers/user")
const taskRouter = require("./routers/task")

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
  console.log(`Server is up on port : ${port}`)
})


// const main = async () => {
//   const task = await User.find({_id: '632859bf895638fa3c8e8c93'}).populate('owner')
//   console.log(task)
// }

// main()