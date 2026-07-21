if (typeof globalThis.process === "undefined") {
  globalThis.process = { env: { NODE_ENV: "production" } }
}