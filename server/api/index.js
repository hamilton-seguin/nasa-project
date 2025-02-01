const serverless = require('serverless-http')
const app = require('../src/app')

const { mongoConnect } = require('../src/services/mongo')
const { loadPlanetsData } = require('../src/models/planets.model')
const { loadLaunchData } = require('../src/models/launches.model')

let isInitialized = false
async function init() {
  if (!isInitialized) {
    await mongoConnect()
    await loadPlanetsData()
    await loadLaunchData()
    console.log('Database and data loaded')
    isInitialized = true
  }
}

module.exports = async (req, res) => {
  await init()
  return serverless(app)(req, res)
}
