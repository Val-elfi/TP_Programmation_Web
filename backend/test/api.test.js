import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";
import { Track } from "../src/models/Track.js";

let server, base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

test("health sans dépendre de MongoDB", async () => {
  const r = await fetch(base + "/api/health");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, "ok");
});

test("schémas Mongoose et relation", () => {
  const u = new User({
    name: "Test",
    email: "TEST@example.com",
    password: "12345678",
  });

  assert.equal(u.email, "test@example.com");
  const t = new Track({
    ownerId: new mongoose.Types.ObjectId(),
    title: "Blues",
    originalName: "b.mp3",
    storedName: "x.mp3",
    mimeType: "audio/mpeg",
    size: 42,
  });

  assert.equal(t.title, "Blues");
  assert.equal(Track.schema.path("ownerId").options.ref, "User");
});

test("PUT /api/users/me refuse une requête sans en-tête Authorization (401)", async () => {
  const res = await fetch(`${base}/api/users/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Nouveau Nom" }),
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.message, "Authentification requise");
});

test("PUT /api/users/me refuse un jeton invalide (401)", async () => {
  const res = await fetch(`${base}/api/users/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer jeton-invalide-ou-corrompu",
    },
    body: JSON.stringify({ name: "Nouveau Nom" }),
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.message, "Jeton invalide ou expiré");
});

test("PUT /api/users/me refuse un nom manquant ou inférieur à 2 caractères (400)", async () => {
  const secret = process.env.JWT_SECRET || "tp1-development-secret";
  const validToken = jwt.sign(
    { sub: new mongoose.Types.ObjectId().toString(), email: "test@example.com" },
    secret,
  );

  const testCases = [
    { body: {}, desc: "corps vide" },
    { body: { name: "   " }, desc: "espaces uniquement" },
    { body: { name: "A" }, desc: "un seul caractère" },
  ];

  for (const { body } of testCases) {
    const res = await fetch(`${base}/api/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(
      data.message,
      "Le nom est requis et doit contenir au moins 2 caractères",
    );
  }
});