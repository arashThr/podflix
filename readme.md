## Requirments
- Redis
    - pub/sub
- Mongo

## Run
- Make sure `mongo` and `redis` servers are running
- Provide required entries in `.env` file, including `BOT_TOKEN` and payments keys
- Use `ngrok` to open a tunnel to bot port (default to 3000)
- Enter address in `.env` file as `SERVER_URL`
- Run `npm start`

### Promo code
Copy `src/promo.sample` to `data/promo.txt` file and modify it

### Translation
I've used [i18n-editor](https://github.com/jcbvm/i18n-editor/releases) to generate translations files

## Test
- Use `4242 4242 4242 4242` for testing stripe