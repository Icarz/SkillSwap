import { http, HttpResponse } from "msw";

const BASE = "http://localhost:5000/api";

export const mockUser = {
  _id: "user-abc123",
  id: "user-abc123",
  name: "Alice Smith",
  email: "alice@example.com",
  bio: "I love coding",
  skills: [
    { _id: "s1", name: "javascript", category: { name: "programming", icon: "💻" } },
  ],
  learning: [
    { _id: "s2", name: "python", category: { name: "programming", icon: "💻" } },
  ],
  avatar: "",
  createdAt: "2024-01-01T00:00:00Z",
};

export const mockToken = "mock-jwt-token-abc123";

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json();
    if (email === "alice@example.com" && password === "password123") {
      return HttpResponse.json({ token: mockToken, user: mockUser });
    }
    return HttpResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const { name, email } = await request.json();
    if (!name || !email) {
      return HttpResponse.json({ message: "Name, email, and password are required" }, { status: 400 });
    }
    return HttpResponse.json(
      { token: mockToken, user: { ...mockUser, name, email } },
      { status: 201 }
    );
  }),

  // Users
  http.get(`${BASE}/users/all`, () =>
    HttpResponse.json([
      { ...mockUser, avgRating: 4.5, reviewCount: 3, transactionCount: 5 },
    ])
  ),

  http.get(`${BASE}/users/search`, ({ request }) => {
    const url = new URL(request.url);
    const skills = url.searchParams.get("skills");
    if (!skills) return HttpResponse.json({ error: "?skills= required" }, { status: 400 });
    return HttpResponse.json([
      { ...mockUser, avgRating: null, reviewCount: 0, transactionCount: 0 },
    ]);
  }),

  http.get(`${BASE}/users/me`, () => HttpResponse.json(mockUser)),

  http.get(`${BASE}/users/reviews/:userId`, () => HttpResponse.json([])),

  http.get(`${BASE}/users/:userId`, () => HttpResponse.json(mockUser)),
];
