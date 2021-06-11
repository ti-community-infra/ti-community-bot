module.exports = {
  type: "mysql",
  host: process.env.BOT_DB_HOST,
  port: process.env.BOT_DB_PORT,
  username: "root",
  password: process.env.BOT_DB_PASSWORD,
  database: process.env.BOT_DB_NAME,
  timezone: "Z",
  // FIXME: this config can not working on cli migration.
  entities: ["lib/db/entities/**/*.js"],
  migrations: ["lib/db/migrations/**/*.js"],
  subscribers: ["lib/db/subscribers/**/*.js"],
  cli: {
    entitiesDir: "src/db/entities",
    migrationsDir: "src/db/migrations",
    subscribersDir: "src/db/subscribers",
  },
};
