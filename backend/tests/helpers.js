const request = require("supertest");
const app = require("../app");
const Category = require("../models/Category");
const Skill = require("../models/Skill");

const uid = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

/**
 * Register a user and return { token, user, password }
 */
const createUser = async (overrides = {}) => {
  const userData = {
    name: `User_${uid()}`,
    email: `user_${uid()}@test.com`,
    password: "password123",
    ...overrides,
  };
  const res = await request(app).post("/api/auth/register").send(userData);
  if (res.status !== 201) {
    throw new Error(`createUser failed [${res.status}]: ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token, user: res.body.user, password: userData.password };
};

/**
 * Create a skill in the programming category
 */
const createSkill = async (name = null) => {
  const category = await Category.findOne({ name: "programming" });
  const skillName = name || `skill_${uid()}`;
  return Skill.findOneAndUpdate(
    { name: skillName },
    { $setOnInsert: { name: skillName, category: category._id } },
    { upsert: true, new: true }
  );
};

/**
 * Create a transaction for a user
 */
const createTransaction = async (token, skillId, type = "offer") => {
  const res = await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${token}`)
    .send({ skill: skillId, type });
  if (res.status !== 201) {
    throw new Error(`createTransaction failed [${res.status}]: ${JSON.stringify(res.body)}`);
  }
  return res.body;
};

module.exports = { createUser, createSkill, createTransaction, uid };
