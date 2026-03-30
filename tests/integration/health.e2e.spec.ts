import request from "supertest";
import app from "../../src/app";

describe("Health API", () => {
  it("GET /api/v1/health should return 200", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBe(200);
  });
});
