# API Gateway

Port: 3000

## Description
Single entry point for clients. Proxies requests to internal services via Axios.

## Endpoints
This is the root URL to use to access a service for all methods (POST, GET, PUT, DELETE)

- User service: `http://localhost:3000/user-service/.....`
- Auth service: `http://localhost:3000/auth-service/....`
- Event service: `http://localhost:3000/event-service/....`
- Ticket service: `http://localhost:3000/ticket-service/...`
- Order service: `http://localhost:3000/order-service/....`
- Payment service: `http://localhost:3000/payment-service/...`

## Environment
- USER_SERVICE_URL, ORDER_SERVICE_URL, PAYMENT_SERVICE_URL, TICKET_SERVICE_URL

## Run
```bash
npm install
npm start
```
