const request = require("supertest");
const app = require("../../app");

const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

describe("Launches API", () => {
  beforeAll(async () => {
    await mongoConnect();
  });
  afterAll(async () => {
    await mongoDisconnect();
  });
  describe("Test GET /launches", () => {
    test("It should respond with 200 success", async () => {
      const response = await request(app)
        .get("/v1/launches")
        .expect("Content-Type", /json/)
        .expect(200); // supertest assertion statement
      // expect(response.statusCode).toBe(200); jest assertion statement
    });
  });

  describe("Test POST /launches", () => {
    const completeLaunchData = {
      mission: "USS Entreprise.test",
      rocket: "NCC 1302-D",
      target: "Kepler-62 f",
      launchDate: "January 4, 2029",
    };
    const launchDataWithoutDate = {
      mission: "USS Entreprise.test",
      rocket: "NCC 1302-D",
      target: "Kepler-62 f",
    };
    const launchDataWithInvalideDate = {
      mission: "USS Entreprise.test",
      rocket: "NCC 1302-D",
      target: "Kepler-62 f",
      launchDate: "diudihu",
    };

    test("It should repond with 201 success", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeLaunchData)
        .expect("Content-Type", /json/)
        .expect(201);
      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(responseDate).toBe(requestDate);
      expect(response.body).toMatchObject(launchDataWithoutDate);
    });

    test("It should catch missing required properties /w 400 res", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithoutDate)
        .expect("Content-Type", /json/)
        .expect(400);
      expect(response.body).toStrictEqual({
        error: "Missing required launch property",
      });
    });

    test("It should catch invalid dates /w 400 res", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithInvalideDate)
        .expect("Content-Type", /json/)
        .expect(400);
      expect(response.body).toStrictEqual({
        error: "Invalid launch date",
      });
    });
  });
});
