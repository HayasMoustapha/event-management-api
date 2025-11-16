
# Event Management API

## Description
This API manages events, tickets, orders, users, and payments.  
It follows a **microservices architecture** where each service communicates synchronously via **HTTP requests (Axios)**.  
The system includes an **API Gateway** that routes client requests to the appropriate services.

---

## Services

- **Authentication Service** – Manages user authentication and authorization.
- **User Service** – Handles user profiles and roles.
- **Event Service** – Manages event creation, updates, and deletions.
- **Ticket Service** – Manages tickets linked to events (types, prices, quantities).
- **Order Service** – Manages user orders for event tickets.
- **Payment Service** – Handles payments via Stripe (PaymentIntents) and updates order statuses using Axios.

---

## Relationships Between Services

- The **Authentication Service** communicates with the **User Service** to validate credentials.  
- The **Event Service** interacts with the **Ticket Service** to create tickets for new events.  
- The **Order Service** communicates with the **Ticket Service** to check ticket availability and with the **Payment Service** to process payments.  
- The **Payment Service** uses **Stripe PaymentIntents** for card payments and sends synchronous updates to the **Order Service** via Axios once a payment succeeds or fails.  

---

## Shared Data Between Services

- **User**: id, name, email, password, role  
- **Event**: id, name, date, location, description  
- **Ticket**: id, eventId, type, price, quantity  
- **Order**: id, userId, eventId, ticketId, quantity, total, status  
- **Payment**: id, orderId, amount, method, status, stripePaymentIntentId  

---

## API Endpoints

### Authentication
- `POST /login` – Authenticate user  
- `POST /register` – Register new user  

### Users
- `GET /users` – Get all users  
- `GET /user/:id` – Get user details  
- `PUT /user/:id` – Update user  
- `DELETE /user/:id` – Delete user  

### Events
- `GET /events` – List all events  
- `POST /event` – Create a new event  
- `GET /event/:id` – Get event details  
- `PUT /event/:id` – Update event  
- `DELETE /event/:id` – Delete event  

### Tickets
- `GET /event/:eventId/tickets` – List tickets for an event  
- `POST /event/:eventId/ticket` – Create a new ticket for an event  
- `GET /tickets` - Get all tickets
- `GET /ticket/:id` – Get ticket details  
- `PUT /ticket/:id` – Update ticket  
- `DELETE /ticket/:id` – Delete ticket  

### Orders
- `POST /ticket/:ticketId/order` – Create a new order  
- `GET /orders` – List all orders  
- `GET /order/:id` – Get order details  
- `GET /ticket/:ticketId/orders` – Get orders of one ticket details  
- `PUT /order/:id` – Update order 
- `DELETE /order/:id` – Update order 

### Payments (Stripe Integration)
- `GET /payments` - Get all payments
- `POST /order/:orderId/payment/create-intent` – Create a Stripe PaymentIntent (returns client_secret)  
- `POST /payment/webhook` – Receive Stripe payment events (success, failure)
- `POST /payment/cancel` - Cancel payment
- `POST /payment/simulate-success` - Simulate payment
- `DELETE /payment/delete` - 


### API GATEWAY 
It follows the following syntax `localhost:[api-gateway-port]/[service-name]-service/` to be redirected to the service you want. This is the root URL to use to access a service for all methods (POST, GET, PUT, DELETE)
- User service: `http://localhost:3000/user-service/.....`
- Auth service: `http://localhost:3000/auth-service/....`
- Event service: `http://localhost:3000/event-service/....`
- Ticket service: `http://localhost:3000/ticket-service/...`
- Order service: `http://localhost:3000/order-service/....`
- Payment service: `http://localhost:3000/payment-service/...`



---

## How Services Communicate (Synchronous HTTP)

All microservices communicate using **Axios** requests:
- All services call the **User Service** for authentication
- The **Payment Service** calls the **Order Service** directly via its HTTP endpoint to update order statuses.  
- The **Order Service** calls the **Ticket Service** to verify ticket availability before confirming orders.  
- Internal URLs are defined in environment variables (e.g., `ORDER_SERVICE_URL`, `TICKET_SERVICE_URL`).

Example (Payment → Order):
```js
await axios.put(`${process.env.ORDER_SERVICE_URL}/${payment.orderId}`, { status: 'paid' });
```

---

## Technologies Used

- **Node.js** – Runtime environment  
- **Express.js** – API framework
- **underscore** - Library for manage arrays and objects
- **moment** -   Date library 
- **MongoDB** – Database for each microservice  
- **Axios** – HTTP communication between microservices  
- **Stripe** – Payment processing  
- **API Gateway** – Entry point for client requests  

---

## Installation

1. Clone the repository.  
2. Install dependencies with `npm install`.  
3. Configure environment variables (`.env`) for database connections, Stripe API keys, and microservice URLs.  
4. Start each service with `npm start`.  
5. We recommend you to use **POSTMAN** and import our postman collection `event-mangement-api.postman_collection.json` to test all services
---

## Notes

- The system is now **fully synchronous**, replacing RabbitMQ with direct **Axios-based HTTP calls**.  
- Each microservice remains **independent** and can scale separately.  
- For production, consider adding retry logic or service discovery (e.g., Consul, Nginx) for resilience.
