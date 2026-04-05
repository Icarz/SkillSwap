const request = require("supertest");
const app = require("../app");
const { createUser, createSkill } = require("./helpers");

describe("Users — GET /api/users/all", () => {
  it("returns users without auth", async () => {
    await createUser();
    const res = await request(app).get("/api/users/all");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("returns all users including the requester (public route, no self-exclusion)", async () => {
    const { user } = await createUser();
    await createUser();
    const res = await request(app).get("/api/users/all");
    expect(res.status).toBe(200);
    const ids = res.body.map((u) => u._id.toString());
    expect(ids).toContain(user.id.toString());
    expect(res.body.length).toBe(2);
  });

  it("attaches avgRating and transactionCount fields", async () => {
    await createUser();
    const res = await request(app).get("/api/users/all");
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty("avgRating");
    expect(res.body[0]).toHaveProperty("transactionCount");
  });
});

describe("Users — GET /api/users/search", () => {
  it("returns users matching a skill", async () => {
    await createUser({ skills: ["typescript"] });
    const res = await request(app).get("/api/users/search?skills=typescript");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("returns empty array for unknown skill", async () => {
    const res = await request(app).get("/api/users/search?skills=unknownskill99");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("requires skills query param", async () => {
    const res = await request(app).get("/api/users/search");
    expect(res.status).toBe(400);
  });
});

describe("Users — GET /api/users/me", () => {
  it("returns own profile when authenticated", async () => {
    const { token, user } = await createUser();
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
    expect(res.body).not.toHaveProperty("password");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });
});

describe("Users — PUT /api/users/me", () => {
  it("updates bio", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ bio: "I love coding" });
    expect(res.status).toBe(200);
    expect(res.body.bio).toBe("I love coding");
  });

  it("updates skills", async () => {
    const { token } = await createUser();
    const skill = await createSkill("nodejs");
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ skills: [{ name: "nodejs", category: skill.category.toString() }] });
    expect(res.status).toBe(200);
    expect(res.body.skills.length).toBeGreaterThan(0);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).put("/api/users/me").send({ bio: "test" });
    expect(res.status).toBe(401);
  });
});

describe("Users — GET /api/users/:userId", () => {
  it("returns public profile without auth", async () => {
    const { user } = await createUser();
    const res = await request(app).get(`/api/users/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(user.id.toString());
    expect(res.body).not.toHaveProperty("password");
  });

  it("returns 404 for nonexistent user", async () => {
    const fakeId = "60f7b3b3b3b3b3b3b3b3b3b3";
    const res = await request(app).get(`/api/users/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

describe("Users — GET /api/users/matches", () => {
  it("returns matched users", async () => {
    const { token } = await createUser({ skills: ["go"], learning: ["rust"] });
    await createUser({ skills: ["rust"], learning: ["go"] }); // perfect match
    const res = await request(app)
      .get("/api/users/matches")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/users/matches");
    expect(res.status).toBe(401);
  });
});

describe("Users — Reviews", () => {
  it("creates a review for another user", async () => {
    const reviewer = await createUser();
    const reviewed = await createUser();
    const res = await request(app)
      .post("/api/users/review")
      .set("Authorization", `Bearer ${reviewer.token}`)
      .send({ reviewedUser: reviewed.user.id, rating: 5, comment: "Great skill swap!" });
    expect(res.status).toBe(201);
    expect(res.body.rating).toBe(5);
    expect(res.body.comment).toBe("Great skill swap!");
  });

  it("rejects self-review", async () => {
    const { token, user } = await createUser();
    const res = await request(app)
      .post("/api/users/review")
      .set("Authorization", `Bearer ${token}`)
      .send({ reviewedUser: user.id, rating: 5, comment: "I am great" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/yourself/i);
  });

  it("rejects duplicate review", async () => {
    const reviewer = await createUser();
    const reviewed = await createUser();
    const reviewData = { reviewedUser: reviewed.user.id, rating: 4, comment: "Good" };
    await request(app)
      .post("/api/users/review")
      .set("Authorization", `Bearer ${reviewer.token}`)
      .send(reviewData);
    const res = await request(app)
      .post("/api/users/review")
      .set("Authorization", `Bearer ${reviewer.token}`)
      .send(reviewData);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already reviewed/i);
  });

  it("rejects invalid rating", async () => {
    const reviewer = await createUser();
    const reviewed = await createUser();
    const res = await request(app)
      .post("/api/users/review")
      .set("Authorization", `Bearer ${reviewer.token}`)
      .send({ reviewedUser: reviewed.user.id, rating: 6, comment: "Too good" });
    expect(res.status).toBe(400);
  });

  it("retrieves reviews for a user", async () => {
    const reviewer = await createUser();
    const reviewed = await createUser();
    await request(app)
      .post("/api/users/review")
      .set("Authorization", `Bearer ${reviewer.token}`)
      .send({ reviewedUser: reviewed.user.id, rating: 3, comment: "Okay" });
    const res = await request(app).get(`/api/users/reviews/${reviewed.user.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].rating).toBe(3);
  });

  it("deletes own review", async () => {
    const reviewer = await createUser();
    const reviewed = await createUser();
    const createRes = await request(app)
      .post("/api/users/review")
      .set("Authorization", `Bearer ${reviewer.token}`)
      .send({ reviewedUser: reviewed.user.id, rating: 5, comment: "Awesome" });
    const reviewId = createRes.body._id;
    const delRes = await request(app)
      .delete(`/api/users/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${reviewer.token}`);
    expect(delRes.status).toBe(200);
  });

  it("cannot delete another user's review", async () => {
    const reviewer = await createUser();
    const reviewed = await createUser();
    const stranger = await createUser();
    const createRes = await request(app)
      .post("/api/users/review")
      .set("Authorization", `Bearer ${reviewer.token}`)
      .send({ reviewedUser: reviewed.user.id, rating: 5, comment: "Nice" });
    const reviewId = createRes.body._id;
    const delRes = await request(app)
      .delete(`/api/users/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${stranger.token}`);
    expect(delRes.status).toBe(404);
  });
});
