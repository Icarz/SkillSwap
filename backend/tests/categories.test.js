const request = require("supertest");
const app = require("../app");
const { createUser } = require("./helpers");
const Category = require("../models/Category");
const Skill = require("../models/Skill");

describe("Categories — GET /api/categories", () => {
  it("returns all categories without auth", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // "programming" is seeded in beforeAll
    expect(res.body.some((c) => c.name === "programming")).toBe(true);
  });

  it("returns categories sorted by name", async () => {
    await Category.create({ name: "zumba", icon: "💃" });
    await Category.create({ name: "art", icon: "🎨" });
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    const names = res.body.map((c) => c.name);
    expect(names).toEqual([...names].sort());
  });
});

describe("Categories — GET /api/categories/:categoryId/skills", () => {
  it("returns skills in a category", async () => {
    const category = await Category.findOne({ name: "programming" });
    await Skill.create({ name: "elixir", category: category._id });
    const res = await request(app).get(`/api/categories/${category._id}/skills`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((s) => s.name === "elixir")).toBe(true);
  });

  it("returns empty array for category with no skills", async () => {
    const cat = await Category.create({ name: "newcat", icon: "🆕" });
    const res = await request(app).get(`/api/categories/${cat._id}/skills`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("Categories — POST /api/categories", () => {
  it("creates a category when authenticated", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "music", icon: "🎵", description: "All things music" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("music");
    expect(res.body.icon).toBe("🎵");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .post("/api/categories")
      .send({ name: "cooking", icon: "🍳" });
    expect(res.status).toBe(401);
  });

  it("rejects missing name", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ icon: "🎮" });
    expect(res.status).toBe(400);
  });

  it("rejects duplicate category name", async () => {
    const { token } = await createUser();
    await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "design" });
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "design" });
    expect(res.status).toBe(400);
  });
});
