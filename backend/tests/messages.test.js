const request = require("supertest");
const app = require("../app");
const { createUser } = require("./helpers");

describe("Messages — POST /api/messages", () => {
  it("sends a message to another user", async () => {
    const sender = await createUser();
    const receiver = await createUser();
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${sender.token}`)
      .send({ receiver: receiver.user.id, content: "Hello there!" });
    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe("Hello there!");
  });

  it("rejects sending message to self", async () => {
    const { token, user } = await createUser();
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ receiver: user.id, content: "Talking to myself" });
    expect(res.status).toBe(400);
  });

  it("rejects empty content", async () => {
    const sender = await createUser();
    const receiver = await createUser();
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${sender.token}`)
      .send({ receiver: receiver.user.id, content: "" });
    expect(res.status).toBe(400);
  });

  it("rejects content over 2000 characters", async () => {
    const sender = await createUser();
    const receiver = await createUser();
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${sender.token}`)
      .send({ receiver: receiver.user.id, content: "x".repeat(2001) });
    expect(res.status).toBe(400);
  });

  it("returns 401 without auth", async () => {
    const receiver = await createUser();
    const res = await request(app)
      .post("/api/messages")
      .send({ receiver: receiver.user.id, content: "Hi" });
    expect(res.status).toBe(401);
  });
});

describe("Messages — GET /api/messages/:userId", () => {
  it("returns messages for authenticated user", async () => {
    const userA = await createUser();
    const userB = await createUser();
    await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ receiver: userB.user.id, content: "Hey!" });
    const res = await request(app)
      .get(`/api/messages/${userA.user.id}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it("returns 401 without auth", async () => {
    const { user } = await createUser();
    const res = await request(app).get(`/api/messages/${user.id}`);
    expect(res.status).toBe(401);
  });

  it("returns 403 when accessing another user's messages", async () => {
    const userA = await createUser();
    const userB = await createUser();
    const res = await request(app)
      .get(`/api/messages/${userB.user.id}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(res.status).toBe(403);
  });
});

describe("Messages — GET /api/messages/:userId/:otherUserId", () => {
  it("returns conversation thread between two users", async () => {
    const userA = await createUser();
    const userB = await createUser();
    await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ receiver: userB.user.id, content: "First message" });
    await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ receiver: userA.user.id, content: "Reply" });
    const res = await request(app)
      .get(`/api/messages/${userA.user.id}/${userB.user.id}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("messages");
    expect(res.body.messages.length).toBe(2);
  });

  it("returns 401 without auth", async () => {
    const userA = await createUser();
    const userB = await createUser();
    const res = await request(app).get(`/api/messages/${userA.user.id}/${userB.user.id}`);
    expect(res.status).toBe(401);
  });
});

describe("Messages — GET /api/messages/unread/count", () => {
  it("returns unread message count", async () => {
    const userA = await createUser();
    const userB = await createUser();
    await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ receiver: userB.user.id, content: "Unread msg" });
    const res = await request(app)
      .get("/api/messages/unread/count")
      .set("Authorization", `Bearer ${userB.token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("unreadCount");
    expect(res.body.unreadCount).toBe(1);
  });

  it("returns 0 when no unread messages", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get("/api/messages/unread/count")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(0);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/messages/unread/count");
    expect(res.status).toBe(401);
  });
});
