const LEVELS = ["error", "warn", "info", "debug"];
const level =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");
const thresh = LEVELS.indexOf(level);

const line = (lvl, msg, ctx) => {
  const base = { ts: new Date().toISOString(), level: lvl, msg };
  return JSON.stringify(ctx ? { ...base, ...ctx } : base);
};

export const logger = {
  error: (msg, ctx) => {
    if (thresh >= 0) console.error(line("error", msg, ctx));
  },
  warn: (msg, ctx) => {
    if (thresh >= 1) console.warn(line("warn", msg, ctx));
  },
  info: (msg, ctx) => {
    if (thresh >= 2) console.log(line("info", msg, ctx));
  },
  debug: (msg, ctx) => {
    if (thresh >= 3) console.log(line("debug", msg, ctx));
  },
};
