const http = require('http')

require('dotenv').config()

const express = require('express')
const path = require('path')
const cors = require('cors')
const morgan = require('morgan')

const api = require('./routes/api')

const app = express()

// Create a sub-app for the nasa-api routes
const nasaApp = express();

nasaApp.use(express.json());
nasaApp.use(morgan('combined'));

// Serve static assets at /nasa-api/static
nasaApp.use('/static', express.static(path.join(__dirname, '..', 'public')));

// API routes should be mounted relative to the sub-app.
nasaApp.use('/v1', api);

// For any other route, serve the React app’s index.html.
// Make sure that the built index.html (in your public folder) is using relative paths.
nasaApp.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Mount the sub-app under /nasa-api
app.use('/nasa-api', nasaApp);

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
