import test from "node:test";
import assert from "node:assert/strict";

import "dotenv/config";
import { spawn } from "node:child_process";
import mongoose from "mongoose";

import Report from "../src/models/Report.js";

const waitForServer = (proc) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Server start timeout")),
      12000,
    );

    proc.stdout.on("data", (data) => {
      const text = data.toString();
      if (text.includes("Server running on port")) {
        clearTimeout(timer);
        resolve();
      }
    });

    proc.stderr.on("data", (data) => {
      const text = data.toString();
      if (text.includes("Failed to start server")) {
        clearTimeout(timer);
        reject(new Error(text));
      }
    });
  });

let proc;
const shouldRun = process.env.RUN_INTEGRATION_TESTS === "1";
const integrationUsername = "octocat";
const mongoUri = process.env.MONGODB_URI;

test.before(async () => {
  if (!shouldRun) {
    return;
  }

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required for integration tests.");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  await Report.deleteOne({ username: integrationUsername });

  proc = spawn("node", ["app.js"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  await waitForServer(proc);
});

test.after(async () => {
  if (!shouldRun) {
    return;
  }

  if (proc) {
    proc.kill();
  }

  await mongoose.connection.close();
});

test(
  "GET /api/profile/:username/cached returns 404 when missing",
  { skip: !shouldRun },
  async () => {
    const res = await fetch(
      "http://localhost:5000/api/profile/nonexistent-user-xyz/cached",
    );

    assert.equal(res.status, 404);
  },
);

test(
  "GET /api/compare validates required query params",
  { skip: !shouldRun },
  async () => {
    const res = await fetch("http://localhost:5000/api/compare");

    assert.equal(res.status, 400);
  },
);

test(
  "GET /api/profile/:username transitions from cache miss to hit and persists report",
  { skip: !shouldRun },
  async () => {
    const first = await fetch(
      `http://localhost:5000/api/profile/${integrationUsername}`,
    );
    assert.equal(first.status, 200);
    const firstBody = await first.json();

    assert.equal(firstBody.cache.hit, false);
    assert.ok(firstBody.scores.overall >= 0 && firstBody.scores.overall <= 100);

    const dbDoc = await Report.findOne({
      username: integrationUsername,
    }).lean();
    assert.ok(dbDoc, "Expected cached report document to be created");
    assert.equal(dbDoc.username, integrationUsername);
    assert.ok(dbDoc.expiresAt, "Expected expiresAt to be present");
    assert.ok(dbDoc.report?.scores?.overall >= 0);

    const second = await fetch(
      `http://localhost:5000/api/profile/${integrationUsername}`,
    );
    assert.equal(second.status, 200);
    const secondBody = await second.json();

    assert.equal(secondBody.cache.hit, true);
    assert.ok(secondBody.cache.cachedAt);
    assert.ok(secondBody.cache.expiresAt);
  },
);
