import test from "node:test";
import assert from "node:assert/strict";

import { spawn } from "node:child_process";

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

test.before(async () => {
  if (!shouldRun) {
    return;
  }

  proc = spawn("node", ["app.js"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  await waitForServer(proc);
});

test.after(() => {
  if (!shouldRun) {
    return;
  }

  if (proc) {
    proc.kill();
  }
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
