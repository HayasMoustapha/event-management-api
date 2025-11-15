# Order Service

Port: 4003

## Description
Creates orders after checking ticket availability synchronously via Axios. Updates order status and reduces stock when paid.

## Endpoints
- `GET /orders` 
- `GET /order/:id`
- `GET /ticket/:ticketId/orders`
- `POST /ticket/:ticketId/order`
- `PUT /order/:id`
- `DELETE /order/:id`

## Environment
- MONGODB_URI, TICKET_SERVICE_URL

## Run
```bash
npm install
npm start
```
