const request = require("supertest");
const app = require("../app");

describe("Auth — POST /api/auth/register", () => {
  it("registers a new user and returns token + user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({ name: "Alice", email: "alice@example.com" });
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("registers user with skills and learning goals", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Bob",
      email: "bob@example.com",
      password: "password123",
      skills: ["javascript", "react"],
      learning: ["python"],
    });
    expect(res.status).toBe(201);
    expect(res.body.user.skills).toHaveLength(2);
    expect(res.body.user.learning).toHaveLength(1);
  });

  it("rejects duplicate email", async () => {
    const data = { name: "Dup", email: "dup@example.com", password: "password123" };
    await request(app).post("/api/auth/register").send(data);
    const res = await request(app).post("/api/auth/register").send(data);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email already exists/i);
  });

  it("rejects missing name", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "noname@example.com",
      password: "password123",
    });
    expect(res.status).toBe(400);
  });

  it("rejects missing email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "No Email",
      password: "password123",
    });
    expect(res.status).toBe(400);
  });

  it("rejects missing password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "No Pass",
      email: "nopass@example.com",
    });
    expect(res.status).toBe(400);
  });
});

describe("Auth — POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Login User",
      email: "loginuser@example.com",
      password: "password123",
    });
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "loginuser@example.com",
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe("loginuser@example.com");
  });

  it("rejects wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "loginuser@example.com",
      password: "wrongpass",
    });
    expect(res.status).toBe(401);
  });

  it("rejects nonexistent user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "ghost@example.com",
      password: "password123",
    });
    expect(res.status).toBe(401);
  });

  it("rejects missing password field", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "loginuser@example.com",
    });
    expect(res.status).toBe(400);
  });

  it("rejects missing email field", async () => {
    const res = await request(app).post("/api/auth/login").send({
      password: "password123",
    });
    expect(res.status).toBe(400);
  });
});
