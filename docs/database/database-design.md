# Database Design

## Scope Goal

Define a production-oriented relational data model for the E-Commerce Platform - Laravel React project. The design targets a Laravel 12 API, a React and Vite frontend, and MySQL. It establishes the tables, ownership boundaries, data-retention rules, and implementation sequence that later database and feature scopes can follow.

This document describes a design only. It does not claim that migrations, models, authentication, or business features have been implemented.

## Included

- Logical database modules and table ownership
- Final business table inventory
- Primary key, foreign key, naming, money, inventory, snapshot, retention, and RBAC decisions
- Roles supported by the design: Super Admin, Store Manager, and Customer
- References to the detailed schema, relationships, constraints, ERD, and future migration plan

## Excluded

- Laravel migrations and seeders
- Model, controller, service, request, resource, route, or policy implementation
- Authentication and authorization behavior
- Product, inventory, cart, checkout, order, payment, shipping, coupon, review, report, or dashboard behavior
- React integration and API contracts
- Production data or claims that the schema has been deployed

## Project Context

| Area | Technology |
|---|---|
| Project | E-Commerce Platform - Laravel React |
| Backend | Laravel 12 API |
| Frontend | React + Vite |
| Database | MySQL |
| Business roles | Super Admin, Store Manager, Customer |

## Module Overview

| Module | Purpose | Tables |
|---|---|---|
| Identity & Access | Users and custom role-based access control | `users`, `roles`, `permissions`, `role_user`, `permission_role` |
| Customer Profile | Customer details and reusable addresses | `customer_profiles`, `customer_addresses` |
| Catalog | Categories, products, media, attributes, values, and sellable variants | `categories`, `products`, `product_images`, `product_attributes`, `product_attribute_values`, `product_variants` |
| Inventory | Current stock and immutable stock history | `inventory_stocks`, `stock_movements` |
| Cart | Active or historical shopping carts and their lines | `carts`, `cart_items` |
| Orders | Order headers, line snapshots, address snapshots, and status history | `orders`, `order_items`, `order_addresses`, `order_status_histories` |
| Payments & Shipping | Payment attempts and shipment lifecycle records | `payments`, `shipments` |
| Coupons | Coupon definitions and redemption history | `coupons`, `coupon_redemptions` |
| Reviews | Customer product reviews and moderation state | `product_reviews` |
| Audit Logs | Append-oriented records of material system activity | `audit_logs` |

## Final Business Tables

1. `users`
2. `roles`
3. `permissions`
4. `role_user`
5. `permission_role`
6. `customer_profiles`
7. `customer_addresses`
8. `categories`
9. `products`
10. `product_images`
11. `product_attributes`
12. `product_attribute_values`
13. `product_variants`
14. `inventory_stocks`
15. `stock_movements`
16. `carts`
17. `cart_items`
18. `orders`
19. `order_items`
20. `order_addresses`
21. `order_status_histories`
22. `payments`
23. `shipments`
24. `coupons`
25. `coupon_redemptions`
26. `product_reviews`
27. `audit_logs`

## Important Design Decisions

### Conventions

- Table and column names use `snake_case`.
- Every table uses an unsigned `bigint` primary key named `id`, including RBAC pivot tables.
- Relationships use foreign keys where the referenced table is known and relational integrity can be enforced.
- Standard mutable records use `created_at` and `updated_at`; append-oriented history records may use only `created_at` or a domain event timestamp.
- Enumerated business states are initially represented as bounded strings so lifecycle changes do not require MySQL enum alterations. Laravel enums may be introduced in a later implementation scope.

### Money and Quantities

- Monetary amounts use `decimal(10,2)` and are stored with an ISO 4217 currency code where the owning record needs currency context.
- Percentage rates use an appropriately bounded decimal such as `decimal(5,2)` rather than a money type.
- Order and payment totals are persisted values. Their arithmetic and reconciliation rules will be enforced later in application services and database checks where practical.

### Catalog and Inventory

- `products` are catalog parents. `product_variants` are the sellable units and represent the purchasable SKUs.
- Every product, including a simple product with no customer-selectable options, has one default product variant.
- Product stock is never stored on `products`.
- `inventory_stocks` stores the current quantity for each product variant.
- `stock_movements` stores append-oriented stock history, including before and after quantities and an optional business reference.
- Inventory and cart records target `product_variants` or their `inventory_stocks`. Order items retain the purchased variant reference alongside durable snapshots.
- `product_variants.attributes_json` stores the selected attribute-value representation for a variant. Attribute definition tables remain the source of allowed catalog values.

### Order Snapshots

- `order_items` stores product, SKU, variant, attribute, price, discount, tax, and line-total snapshots. Historical orders therefore remain understandable if catalog records later change or are soft deleted.
- `order_addresses` stores billing and shipping address snapshots. Order history does not depend on a customer's current saved addresses.
- `coupon_redemptions` is the authoritative link between an order and an applied coupon. An order has at most one redemption, while `orders.discount_total` preserves the resulting order-level discount snapshot.

### Soft Deletes and Retention

- Soft deletes apply to `users`, `customer_addresses`, `categories`, `products`, `product_variants`, `coupons`, and `product_reviews`.
- Orders, order items, payments, shipments, stock movements, coupon redemptions, and audit logs are not normally deleted. These records support financial, operational, and audit history.
- Hard deletion, anonymization, and statutory retention workflows are separate future concerns and must be explicit rather than incidental cascade operations.

### Identity, Access, and Audit

- Custom RBAC uses `users`, `roles`, `permissions`, `role_user`, and `permission_role`; no third-party permission schema is assumed.
- The initial business roles are Super Admin, Store Manager, and Customer. Role records will be introduced later through a controlled data setup process.
- `audit_logs` uses `auditable_type` and `auditable_id` as a polymorphic-style reference. No database foreign key is possible across multiple auditable tables, so application validation and indexes protect lookup quality.

## Companion Documents

- [Schema Blueprint](schema-blueprint.md)
- [Relationships](relationships.md)
- [Indexes and Constraints](indexes-and-constraints.md)
- [ERD](erd.md)
- [Migration Plan](migration-plan.md)
