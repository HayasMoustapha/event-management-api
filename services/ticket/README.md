# Ticket Service

Port: 4003

## Description
Manages tickets and stock.

## Endpoints
- `GET /event/:eventId/tickets`
- `GET /ticket/:id`
- `GET /tickets`
- `POST /event/:eventId/ticket`
- `GET /ticket/:id/`
- `PUT /ticket/:id/`
- `DELETE /ticket/:id/`

## Environment
- MONGODB_URI

## Run
```bash
npm install
npm start
```
