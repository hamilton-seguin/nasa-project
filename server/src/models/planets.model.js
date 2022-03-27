const path = require("path");
const fs = require("fs");
const { parse } = require("csv-parse");

const planets = require("./planets.mongo");

function isHabitablePlanet(planet) {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
}

function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "..", "..", "data", "kepler_data.csv")
    )
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", async (data) => {
        if (isHabitablePlanet(data)) {
          savePlanet(data);
        }
      })
      .on("error", (err) => {
        reject(err);
      })
      .on("end", async () => {
        const countPlanetsFound = await getAllPlanets();
        console.log(`${countPlanetsFound.length} habitable planets found!`);
        resolve();
      });
  });
}

async function getAllPlanets() {
  return await planets.find({}, {
      _id: 0,
      __v: 0,
    });
}

async function savePlanet(planet) {
  try {
    await planets.updateOne(
      { keplerName: planet.kepler_name },
      { keplerName: planet.kepler_name },
      { upsert: true }
    );
  } catch (err) {
    console.error(`Couldnt save planets: ${err}`);
  }
}

//finds/filters in the mongoDB planets collection all entries with keplerName that have a matching kepler_name from the "data" of the csv file
//if it doesn't exist, does nothing (only updates without "upsert:true")
//if it does already exist, updates with this second argument
//update-insert: if the filter doesn't find a match: insert new entry with the 2nd argument properties

module.exports = {
  loadPlanetsData,
  getAllPlanets,
};
