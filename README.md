# KETTTLe
Virginia Tech Bio Capstone 2018 

### Running locally
There are two ways this can be run locally, manually or using Docker.

#### Manual Setup
This requires `MongoDB` to be installed locally. You will have to have a `mongod`
instance running on port 27017.

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
