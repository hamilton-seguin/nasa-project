const http = require('http')

require('dotenv').config()

const express = require('express')
const path = require('path')
const cors = require('cors')
const morgan = require('morgan')

const api = require('./routes/api')

const app = express()

// app.use(
//   cors({
//     origin: 'http://localhost:3000',
//   })
// )

app.use(express.json())
app.use('/nasa-api/static', express.static(path.join(__dirname, '..', 'public')))
app.use(morgan('combined'))

app.use('/v1', api)

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

const { loadPlanetsData } = require('./models/planets.model')
const { mongoConnect } = require('./services/mongo')
const { loadLaunchData } = require('./models/launches.model')

const PORT = process.env.PORT || 8000
const server = http.createServer(app)

async function startServer() {
  await mongoConnect()
  await loadPlanetsData()
  await loadLaunchData()
  server.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}...`)
  })
}
startServer()

module.exports = app
