require('dotenv').config()

const app = require('./app')
const { loadPlanetsData } = require('./models/planets.model')
const { mongoConnect } = require('./services/mongo')
const { loadLaunchData } = require('./models/launches.model')

async function init() {
  await mongoConnect()
  await loadPlanetsData()
  await loadLaunchData()
  console.log(`Database and data loaded`)
}

init().catch((err) => {
  console.error("Error during server initialization", err);
});

module.exports = app