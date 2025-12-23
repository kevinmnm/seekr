## Prerequisits
- Install [Nodejs](https://nodejs.org/en)
- Install Yarn (If you already have Nodejs installed, just run `corepack enable` in CLI)
- OpenAI API Key

## How to run app

### via Docker Compose
1. In docker/.env file, declare OpenAI API key
```yaml
OPEN_AI_KEY='sk-...'
```

2. From root of this project, run `npm run docker-compose-up`

### via Local Development Server
1. In server/.env file, declare OpenAI API key
```yaml
OPEN_AI_KEY='sk-..'
```

2. Run command `npm run setup`

3. Run command `npm run dev:all`