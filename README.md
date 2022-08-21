# MERN Chat

A chat app, similar to Discord, created using the MERN stack.

Socket.io is used to send and receive messages in real time.

## Getting Started

Run the project by following these instructions:

- Install all dependencies in the root and client folders
- Create a `.env` file in the root folder and fill it with the appropriate variables
  - MONGO_URI - The MongoDB URI to connect to
  - ACCESS_TOKEN_SECRET - The secret that will be used to generate access tokens for authentication
  - REFRESH_TOKEN_SECRET - The secret that will be used to generate refresh tokens for authentication
  - NODE_ENV - Set whether the app should run in `development` mode and have the server act only as an api or in `production` mode and have the server both fetch the webpack bundle and the api (if not specified, will run in development mode)
- Run the suitable npm script (requires nodemon to be globally installed to run the server)

```sh
# Run the api server on port 8000 (by default) and the client on port 8080 (by default)
# Build the webpack bundle before running this command for the first time
npm run dev

# Build the production webpack bundle and run the server on port 8000 (by default)
# The server fetches both the bundle and the api
npm run prod

# Build the production webpack bundle
npm run build

# Build the development webpack bundle
npm run build-dev

# Run the api server on port 8000 (by default) with live reloading
npm run server

```

## Author

Borislav Branimirov

## License

This project is licensed under the MIT License
