const express = require('express')
const app = express()
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
app.use(express.json())
const bcrypt = require('bcrypt')
let db = null
const dbPath = path.join(__dirname, 'userData.db')

const connectDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Port running on 3000')
    })
  } catch (e) {
    console.loge(`Error ${e}`)
  }
}

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  if (password.length < 5) {
    response.status(400)
    response.send('Password is too short')
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  const checkUser = `SELECT * FROM user WHERE username = ${username}`
  const sendQuery = db.get(checkUser)
  if (sendQuery === undefined) {
    const createUser = `
    INSERT INTO user(username, name, password, gender,location)
    VALUES(
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}

    )
    `
    await db.run(createUser)
    response.send('User Created Sucessfully')
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = ${username}`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const authorize = await bcrypt.compare(password, dbUser.password)
    if (authorize) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid Password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  if (newPassword.length < 5) {
    response.status(400)
    response.send('Password is too short')
  }
  const selectUserQuery = `SELECT * FROM user WHERE username = ${username}`
  const dbUser = db.get(selectUserQuery)
  if (dbUser !== undefined) {
    const authorize = await bcrypt.compare(oldPassword, dbUser.password)
    if (authorize) {
      const updatePassword = `
      UPDATE user SET password = ${hashedPassword}
      `
      await db.run(updatePassword)
      response.send('Password updated')
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
