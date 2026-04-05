const request = require("supertest");
const app = require("../app");
const { createUser, createSkill, createTransaction } = require("./helpers");

describe("Transactions — POST /api/transactions", () => {
  it("creates an offer transaction", async () => {
    const { token } = await createUser();
    const skill = await createSkill();
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ skill: skill._id, type: "offer" });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("offer");
    expect(res.body.status).toBe("pending");
  });

  it("creates a request transaction", async () => {
    const { token } = await createUser();
    const skill = await createSkill();
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ skill: skill._id, type: "request" });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("request");
  });

  it("returns 401 without auth", async () => {
    const skill = await createSkill();
    const res = await request(app)
      .post("/api/transactions")
      .send({ skill: skill._id, type: "offer" });
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing skill", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "offer" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid type", async () => {
    const { token } = await createUser();
    const skill = await createSkill();
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ skill: skill._id, type: "invalid" });
    expect(res.status).toBe(400);
  });
});

describe("Transactions — GET /api/transactions", () => {
  it("returns own transactions with pagination", async () => {
    const { token } = await createUser();
    const skill = await createSkill();
    await createTransaction(token, skill._id, "offer");
    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("transactions");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("page");
    expect(res.body.transactions.length).toBe(1);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/transactions");
    expect(res.status).toBe(401);
  });
});

describe("Transactions — GET /api/transactions/filter", () => {
  it("filters by status", async () => {
    const { token } = await createUser();
    const skill = await createSkill();
    await createTransaction(token, skill._id, "offer");
    const res = await request(app)
      .get("/api/transactions/filter?status=pending")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.transactions.every((t) => t.status === "pending")).toBe(true);
  });

  it("filters by type", async () => {
    const { token } = await createUser();
    const skill = await createSkill();
    await createTransaction(token, skill._id, "offer");
    await createTransaction(token, skill._id, "request");
    const res = await request(app)
      .get("/api/transactions/filter?type=offer")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.transactions.every((t) => t.type === "offer")).toBe(true);
  });
});

describe("Transactions — GET /api/transactions/user/:userId", () => {
  it("returns all transactions for a user (as initiator or acceptor)", async () => {
    const userA = await createUser();
    const userB = await createUser();
    const skill = await createSkill();

    // A creates offer; B accepts it
    const tx = await createTransaction(userA.token, skill._id, "offer");
    await request(app)
      .patch(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ status: "accepted" });

    const res = await request(app)
      .get(`/api/transactions/user/${userA.user.id}`)
      .set("Authorization", `Bearer ${userB.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });
});

describe("Transactions — PATCH /api/transactions/:id (status updates)", () => {
  it("accepts a transaction (different user)", async () => {
    const userA = await createUser();
    const userB = await createUser();
    const skill = await createSkill();
    const tx = await createTransaction(userA.token, skill._id, "offer");
    const res = await request(app)
      .patch(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ status: "accepted" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("accepted");
    expect(res.body.acceptor).toBeTruthy();
  });

  it("owner cannot accept their own transaction", async () => {
    const { token } = await createUser();
    const skill = await createSkill();
    const tx = await createTransaction(token, skill._id, "offer");
    const res = await request(app)
      .patch(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "accepted" });
    expect(res.status).toBe(400);
  });

  it("completes an accepted transaction", async () => {
    const userA = await createUser();
    const userB = await createUser();
    const skill = await createSkill();
    const tx = await createTransaction(userA.token, skill._id, "offer");
    await request(app)
      .patch(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ status: "accepted" });
    const res = await request(app)
      .patch(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ status: "completed" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
  });

  it("cancels a transaction", async () => {
    const { token } = await createUser();
    const skill = await createSkill();
    const tx = await createTransaction(token, skill._id, "offer");
    const res = await request(app)
      .patch(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "cancelled" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
  });

  it("rejects invalid status", async () => {
    const { token } = await createUser();
    const skill = await createSkill();
    const tx = await createTransaction(token, skill._id, "offer");
    const res = await request(app)
      .patch(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "flying" });
    expect(res.status).toBe(400);
  });
});

describe("Transactions — DELETE /api/transactions/:id", () => {
  it("creator can delete their transaction", async () => {
    const { token } = await createUser();
    const skill = await createSkill();
    const tx = await createTransaction(token, skill._id, "offer");
    const res = await request(app)
      .delete(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("acceptor cannot delete the transaction", async () => {
    const userA = await createUser();
    const userB = await createUser();
    const skill = await createSkill();
    const tx = await createTransaction(userA.token, skill._id, "offer");
    await request(app)
      .patch(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ status: "accepted" });
    const res = await request(app)
      .delete(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${userB.token}`);
    expect(res.status).toBe(403);
  });

  it("stranger cannot delete transaction", async () => {
    const userA = await createUser();
    const stranger = await createUser();
    const skill = await createSkill();
    const tx = await createTransaction(userA.token, skill._id, "offer");
    const res = await request(app)
      .delete(`/api/transactions/${tx._id}`)
      .set("Authorization", `Bearer ${stranger.token}`);
    expect(res.status).toBe(403);
  });
});

describe("Transactions — POST /api/transactions/:id/propose-swap", () => {
  it("proposes a swap on another user's request", async () => {
    const userA = await createUser();
    const userB = await createUser();
    const skill = await createSkill();
    const offeredSkill = await createSkill();

    // B creates a request
    const requestTx = await createTransaction(userB.token, skill._id, "request");

    // A proposes a swap
    const res = await request(app)
      .post(`/api/transactions/${requestTx._id}/propose-swap`)
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ offeredSkillId: offeredSkill._id });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("proposed-swap");
  });

  it("cannot propose swap on own transaction", async () => {
    const { token } = await createUser();
    const skill = await createSkill();
    const offeredSkill = await createSkill();
    const requestTx = await createTransaction(token, skill._id, "request");
    const res = await request(app)
      .post(`/api/transactions/${requestTx._id}/propose-swap`)
      .set("Authorization", `Bearer ${token}`)
      .send({ offeredSkillId: offeredSkill._id });
    expect(res.status).toBe(400);
  });
});
