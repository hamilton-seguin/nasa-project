const axios = require("axios");

const launchesDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");

const DEFAULT_FLIGHT_NUMBER = 100;

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunches() {
  console.log("Downloading launch data...");
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      select: {
        rocket: 1,
        success: 1,
        upcoming: 1,
        name: 1,
        date_local: 1,
        flight_number: 1,
        payload: 1,
      },
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });
  if (response.status !== 200) {
    console.log("Problem downloading launch data");
    throw new Error("Launch data download failed.");
  }
  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });
    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };
    console.log(`${launch.flightNumber} ${launch.mission}`);
    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });
  if (firstLaunch) {
    console.log("Launch data already loaded!");
  } else {
    await populateLaunches();
  }
}

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  return await findLaunch({ flightNumber: launchId });
}

async function getAllLaunches(skip, limit) {
  await updateHistoryList();
  return await launchesDatabase
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function updateFromApi(flightNum) {
  const response = await axios.post(SPACEX_API_URL, {
    query: {
      flight_number: flightNum,
    },
    options: {
      select: {
        success: 1,
        flight_number: 1,
      },
      pagination: false,
    },
  });
  return response.data.docs;
}

async function updateHistoryList() {
  const today = new Date();
  const upcomingLaunches = await launchesDatabase.find({
    upcoming: true,
  });
  if (upcomingLaunches.length === 0) {
    return console.log("No upcoming launch to update");
  }
  upcomingLaunches.map((upcomingLaunch) => {
    if (upcomingLaunch.launchDate.getTime() < today.getTime()) {
      const docResults = updateFromApi(upcomingLaunch.flightNumber);
      launchesDatabase.findOneAndUpdate(
        { flightNumber: upcomingLaunch.flightNumber },
        { upcoming: false, success: docResults.success },
        { new: true },
        (err, res) => {
          if (err) {
            throw new Error(err);
          } else {
            console.log(
              `Launch n°${res.flightNumber} was updated => upcoming:${res.upcoming}, success:${res.success}`
            );
          }
        }
      );
    }
  });
}

async function latestFlightNumberDatabase() {
  const launchNumber = await launchesDatabase.findOne().sort("-flightNumber");
  if (!launchNumber) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return launchNumber.flightNumber;
}

async function saveLaunch(launch) {
  await launchesDatabase.findOneAndUpdate(
    { flightNumber: launch.flightNumber },
    launch,
    { upsert: true }
  );
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });
  if (!planet) {
    throw new Error("No matching planet found");
  }
  const newFlightNumber = (await latestFlightNumberDatabase()) + 1;
  const newLaunch = Object.assign(launch, {
    flightNumber: newFlightNumber,
    success: true,
    upcoming: true,
    customers: ["ZTM", "NASA"],
  });
  await saveLaunch(newLaunch);
}

//Abort Launches

async function abortLaunchById(launchId) {
  const aborted = await launchesDatabase.updateOne(
    { flightNumber: launchId },
    { upcoming: false, success: false }
  );
  return aborted.matchedCount === 1 && aborted.modifiedCount === 1;
}

module.exports = {
  loadLaunchData,
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
};
