# Payment Service

Port: 4005

## Description
Handles payments with Stripe PaymentIntents. On payment success/failure it updates the Order Service synchronously via Axios.

## Endpoints
- `GET /payments` 
- `POST /payment/order/:orderId/create-intent`
- `POST /payment/webhook` (Stripe webhook)
- `POST /payment/cancel`
- `POST /payment/simulate-success` 
- `DELETE /payment/delete` 

## Environment
- MONGODB_URI, STRIPE_SECRET, STRIPE_WEBHOOK_SECRET, ORDER_SERVICE_URL

## Run
```bash
npm install
npm start
```
