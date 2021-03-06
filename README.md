# KETTTLe
Virginia Tech Bio Capstone 2018 

### Running locally
There are two ways this can be run locally, manually or using Docker.

In both cases, the `MONGO_URL` environment variable is used to link the
server with the database instance. If the environment variable is not configured,
then the server will look at `mongodb://localhost:27017/ketttle-db` by default.

#### Manual Setup
This requires `MongoDB` to be installed locally.

To install the node.js dependencies.

```bash
$ npm install
```

To run the node server locally (it will be on port 3000).
```bash
$ npm run start
```

#### Docker
This just requires `Docker` to be installed locally.
The `Dockerfile` and `docker-compose.yml` files are commented with what each command does.

```bash
$ docker-compose up
```

### Environment Variables
The node server requires a few environment variables to be setup. They are not included in this directory for security purposes.

- MONGO_URL (automatically configured Docker)
- ARC_USER (determines which arc account to use)
- KETTTLE_EMAIL_CLIENT_ID (email verification)
- KETTTLE_EMAIL_CLIENT_SECRET (email verification)
- KETTTLE_EMAIL_REFRESH_TOKEN (email verification)