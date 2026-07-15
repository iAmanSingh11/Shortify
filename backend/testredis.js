import Redis from "ioredis";

const redis = new Redis(
  "redis://default:********@sought-parrot-138367.upstash.io:6379",
  {
    enableReadyCheck: false,
    tls: {},
  }
);

redis.on("connect", () => console.log("Connected"));

redis.on("error", console.log);

setInterval(async () => {
  try {
    const pong = await redis.ping();
    console.log(pong);
  } catch (e) {
    console.log(e);
  }
}, 5000);