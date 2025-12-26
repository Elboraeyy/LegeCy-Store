module.exports = {
  apps : [{
    name   : "inventory-worker",
    script : "./start-worker.mjs",
    args   : "",
    env: {
      NODE_ENV: "production"
    }
  }]
}
