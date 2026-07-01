# Migration Plan

## Scope Statement

This document defines a future implementation order only. Creating, editing, or running Laravel migrations is not part of this documentation scope. No schema described here should be treated as deployed until a later implementation scope creates and verifies it.

## Why Dependency Order Matters

MySQL requires a referenced table and compatible referenced column to exist before a foreign key can be created. A dependency-first order therefore:

- avoids temporarily disabling foreign-key checks;
- keeps each migration independently understandable and reversible;
- makes failed deployments easier to diagnose;
- ensures pivot, history, and transaction tables cannot precede their owners;
- supports reverse-order rollback in development and controlled deployment validation.

The eventual implementation should use one clear migration per table or tightly coupled schema change. Foreign keys should normally be declared with the table when all dependencies already exist. Cyclic or optional actor references may be added in a small follow-up migration if that produces safer rollback behavior.

## Phase 0 - Reconcile the Laravel Baseline

Before business migrations are written:

1. Review Laravel's default migration files and the actual target environment state.
2. Decide how the default `users` migration will be adapted without creating a duplicate `users` table.
3. Preserve framework tables only if they are required by the selected cache, queue, and session configuration.
4. Confirm MySQL version, character set, collation, timezone policy, strict mode, and migration account privileges.
5. Confirm naming, unsigned `bigint`, timestamp, decimal, JSON, and foreign-key conventions from this documentation.

This phase is a review checkpoint, not authorization to change existing migration files in the current scope.

## Phase 1 - Identity & Access Foundation

Create principal records before assignments:

1. `users`
2. `roles`
3. `permissions`
4. `role_user`
5. `permission_role`

`role_user` depends on users and roles. `permission_role` depends on permissions and roles. The optional `assigned_by` and `granted_by` actor references also depend on users.

Role and permission data for Super Admin, Store Manager, and Customer should be introduced later through a controlled, idempotent setup process. The schema migration itself should not conceal business data creation.

## Phase 2 - Customer and Catalog Foundations

Create user-owned profile data and catalog roots before sellable variants:

1. `customer_profiles`
2. `customer_addresses`
3. `categories`
4. `product_attributes`
5. `product_attribute_values`
6. `products`
7. `product_variants`
8. `product_images`

Categories precede products, products precede variants, and product images follow both because an image always references a product and can optionally reference a variant. Products are catalog parents and variants are the sellable SKUs. Every product must receive at least one variant through later application or controlled data setup; a simple product receives one default variant. Attribute definitions precede their values. Selected variant values are stored in `product_variants.attributes_json`, so no additional pivot migration is planned.

## Phase 3 - Inventory

Create current inventory before its immutable history:

1. `inventory_stocks`
2. `stock_movements`

Inventory stocks depend on product variants, the project's sellable units. Stock movements depend on inventory stocks and optionally reference an actor user. The eventual stock write service must update current stock and append its movement within one transaction. No inventory or stock movement should target `products` directly.

## Phase 4 - Cart and Coupon Definitions

Create pre-checkout state and promotion definitions:

1. `carts`
2. `cart_items`
3. `coupons`

Carts depend optionally on users. Cart items depend on carts and product variants. Coupons are created in this phase so later `coupon_redemptions` can reference them; orders do not hold a direct coupon foreign key.

## Phase 5 - Orders and Snapshots

Create the order header before all order-owned records:

1. `orders`
2. `order_items`
3. `order_addresses`
4. `order_status_histories`

Orders depend optionally on users. Order items depend on orders and must target a product variant when created, including the default variant for a simple product; nullable source references support later historical retention. Order addresses depend on orders and optionally retain a saved-address source. Status histories depend on orders and optionally on the user who changed the status.

Snapshot population is application behavior and must be implemented later in a transaction. A migration creates storage only; it does not make snapshots reliable by itself.

## Phase 6 - Payments, Shipping, and Redemption History

Create records that require an existing order:

1. `payments`
2. `shipments`
3. `coupon_redemptions`

Payments and shipments depend on orders. Coupon redemptions depend on coupons and orders, and optionally on users. `coupon_redemptions.order_id` is unique, making the redemption the authoritative coupon association and limiting each order to at most one coupon. Their retention and restrictive delete behavior should be verified with foreign-key tests before feature work begins.

## Phase 7 - Reviews and Audit Logs

Create cross-module history after the relevant subject tables exist:

1. `product_reviews`
2. `audit_logs`

Product reviews depend on products and optionally on users, order items, and approving users. Audit logs have an optional actor foreign key to users; their auditable subject is a polymorphic-style indexed pair rather than a foreign key. Creating audit logs last makes the approved auditable table set explicit during implementation review.

## Future Implementation Checklist

For each future migration:

- use `snake_case` names and unsigned `bigint` identifiers;
- use `decimal(10,2)` for money;
- add foreign keys with the documented cascade, restrict, or set-null behavior;
- add unique constraints and only justified query indexes;
- add `deleted_at` only to the seven documented soft-delete tables;
- avoid stock columns on `products`;
- treat `product_variants` as sellable units and ensure simple products receive one default variant;
- target inventory stocks, cart items, order items, and stock movements through variants or inventory stock rows;
- preserve order item and address snapshot columns;
- keep append-oriented and retained records free of routine soft-delete or hard-delete behavior;
- make `down()` operations reverse dependencies safely in non-production rollback scenarios;
- verify migrations against MySQL rather than relying only on a different test database engine.

## Verification Gates for the Later Scope

When migration implementation is eventually authorized, it should be considered complete only after:

1. All migrations run from an empty MySQL database in dependency order.
2. Rollback and re-run behavior is tested in a disposable environment.
3. Foreign keys, unique keys, check constraints, nullability, decimal precision, and indexes match the approved design.
4. Soft-delete columns exist only on the selected tables.
5. No stock column exists on `products`.
6. Product variants are the only sellable units, and the simple-product path creates one default variant.
7. Cart items and order items target variants, while stock movements target their inventory stock ledger.
8. Coupon usage exists only through `coupon_redemptions`, with unique `order_id` and no direct coupon foreign key on orders.
9. Order snapshots remain usable when optional source records are soft deleted or references are set null.
10. Restricted historical records cannot be accidentally removed through parent deletion.
11. Schema inspection confirms all 27 final business tables and no accidental feature tables.

## Explicit Non-Implementation Notice

Actual Laravel migration creation, model changes, database execution, seed data, and feature implementation are outside this scope and remain future work.
