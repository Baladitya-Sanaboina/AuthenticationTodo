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
    console.log(`Error ${e}`)
  }
}
connectDbAndServer()
const validatePassword = pass => {
  return pass.length > 4
}

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username LIKE 
  '${username}'
  `
  const hasedPassword = await bcrypt.hash(password, 10)
  const databaseUser = await db.get(selectUserQuery)
  if (databaseUser === undefined) {
    const createUserQuery = `
    INSERT INTO user(username, name, password, gender, location)
    VALUES(
      '${username}',
      '${name}',
      '${hasedPassword}',
      '${gender}',
      '${location}'
    )`
    if (validatePassword(password)) {
      await db.run(createUserQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const databaseUser = await db.get(selectUserQuery)
  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password,
    )
    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE 
  username = '${username}'`
  const databaseUser = await db.get(selectUserQuery)
  if (databaseUser !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password,
    )
    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `
        UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}'`
        const user = await db.run(updatePasswordQuery)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
