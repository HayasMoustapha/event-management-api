# User Service

Port: 4000

## Description
Manages users: registration, login, profile. Uses JWT for auth and bcrypt for passwords.

## Endpoints
- `POST /register`
- `POST /login`
- `GET /user/:id`
- `GET /users` (admin only)
- `DELETE /user/:id`

## Environment
- MONGODB_URI, JWT_SECRET

## Run
```bash
npm install
npm start
```
