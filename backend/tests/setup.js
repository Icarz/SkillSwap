const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

// Required env vars for tests
process.env.JWT_SECRET = "test_jwt_secret_for_skillswap";
process.env.NODE_ENV = "test";

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Seed the default "programming" category required by auth controller
  const Category = require("../models/Category");
  await Category.create({ name: "programming", icon: "💻" });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  // Clear all collections except categories (required for user registration)
  const { collections } = mongoose.connection;
  for (const key in collections) {
    if (key !== "categories") {
      await collections[key].deleteMany({});
    }
  }
});
