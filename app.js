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
  const checkUser = `SELECT * FROM user WHERE username = ${username}`
  const sendQuery = db.get(checkUser)
  if (sendQuery === undefined) {
    const createUser = `
    INSERT INTO user(username, name, password, gender,location)
    VALUES(
      '${username}',
      '${name}',
      '${password}',
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
