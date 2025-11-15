# API Gateway

Port: 3000

## Description
Single entry point for clients. Proxies requests to internal services via Axios.

## Endpoints
- `(GET, POST, PUT, DELETE) use  /events`
- `GET /event/:id`
- `POST /event`
- `PUT /event/:id`
- `DELETE /event/:id`

## Environment
- USER_SERVICE_URL, ORDER_SERVICE_URL, PAYMENT_SERVICE_URL, TICKET_SERVICE_URL

## Run
```bash
npm install
npm start
```
