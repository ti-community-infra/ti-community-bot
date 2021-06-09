# ti-community-bot

[![GitHub Actions](https://github.com/ti-community-infra/ti-community-bot/workflows/Test/badge.svg?branch=master)](https://github.com/features/actions)
[![codecov](https://codecov.io/gh/ti-community-infra/ti-community-bot/branch/master/graph/badge.svg)](https://codecov.io/gh/ti-community-infra/ti-community-bot)
[![Probot](https://badgen.net/badge/built%20with/probot/orange?icon=dependabot&cache=86400)](https://probot.github.io/)
[![jest](https://facebook.github.io/jest/img/jest-badge.svg)](https://github.com/facebook/jest)
[![ISC License](https://badgen.net/badge/license/ISC/blue?cache=86400)](https://ti-community-infra.isc-license.org)

> A GitHub App built with [Probot](https://github.com/probot/probot) that a community bot for tidb.

## Require

- Git >= 2.13.0 (**For husky support**)
- Node >= 10
- MYSQL 5.7
- Docker
- Docker Compose >= 3

## Development

```sh
# Copy .env.example to .env (fill in the relevant environment variables)
copy .env.example .env

# docker-compose up the db and bot
docker-compose -f dev.docker-compose.yml up -d --build
```

### Changing code

The directory is mounted directly into the bot Docker container, which means that the nodemon live-reload server will still just work.

If you change some configuration files or environment variables, we need to restart the service to take effect.

```sh
# Rebuild bot Docker image
docker-compose -f dev.docker-compose.yml build bot

# Restart running frontend container (if it's already running)
docker-compose -f dev.docker-compose.yml stop bot
docker-compose -f dev.docker-compose.yml rm bot
docker-compose -f dev.docker-compose.yml up -d
```

## Deploy

Deploy using the docker-compose file of the production environment.

```sh
# docker-compose up the bot
docker-compose -f prod.docker-compose.yml up -d
```

## Contributing

If you have suggestions for how ti-community-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2020 Rustin-Liu <rustin.liu@gmail.com>
