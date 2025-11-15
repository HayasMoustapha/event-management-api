## Data Model for Event Management System

User

- id (unique identifier): string
- name: string
- email: string
- password: string
- role: string (client, administrator, etc.)
- orders: list of Order objects

Event

- id (unique identifier): string
- name: string
- startDate: date
- startTime: date
- endTime: date
- duration: number
- endDate: date
- location: string
- description: string
- type: string
- category: string (free, paid)
- capacity: number (Number of event's places)
- status: string
- tickets: list of Ticket objects

Ticket

- id (unique identifier): string
- event_id: string (reference to Event)
- type: string (adult, child, vip, classic etc.)
- price: number (null if the event is free)
- quantity: number (with respect to the `capacity` defined in the event schema)
- status: string (available, unavailabe)
- orders: list of Order objects

Order

- id (unique identifier): string
- user_id: string (reference to User)
- event_id: string (reference to Event)
- ticket_id: string (reference to Ticket)
- quantity: number
- total: number (0 if the event is free)
- status: string (pending, paid, cancelled, etc.)
- payment: Payment object (null if the event is free)

Payment

- id (unique identifier): string
- order_id: string (reference to Order)
- amount: number
- payment_method: string (credit card, etc.)
- status: string (pending, paid, cancelled, etc.)
- stripePaymentIntentId: string

This data model takes into account free and paid events, as well as the associated tickets and orders. Free events have a null price and do not require payment.


## Class model representation 

class User {
  - id: string
  - name: string
  - email: string
  - password: string
  - role: string
}

class Event {
  - id: string
  - name: string
  - startDate: date
  - startTime: date
  - endTime: date
  - duration: Number 
  - endDate: date
  - location: string
  - description: string
  - capacity: Number
  - category: string
  - type: string
  - price: number
  - status: string
}

class Ticket {
  - id: string
  - event_id: string
  - category: string
  - price: number
  - quantity: number
  - status: string 
}

class Order {
  - id: string
  - user_id: string
  - event_id: string
  - ticket_id: string
  - quantity: number
  - total: number
  - status: string
}

class Payment {
  - id: string
  - order_id: string
  - amount: number
  - payment_method: string
  - status: string
}

User "1" -- "*" Order : orders
Event "1" -- "*" Ticket : tickets
Ticket "*" -- "*" Order : orders
Order "1" -- "1" Payment : payment
Ticket -- Event : event_id >
Order -- User : user_id >
Order -- Event : event_id >
Order -- Ticket : ticket_id >
Payment -- Order : order_id >
