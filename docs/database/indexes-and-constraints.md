# Indexes and Constraints

## Goals

The future schema should use database constraints for durable relational invariants and indexes for measured access patterns. Laravel Form Requests and Services will later enforce workflow rules that require context, authorization, calculations, locking, or coordination across multiple records.

Index names should follow a predictable pattern such as `table_column_index`, while foreign-key names should identify both the child column and referenced table. Exact names can be shortened where required by MySQL identifier limits.

## Primary and Foreign Keys

- Every table has an unsigned `bigint` primary key named `id`.
- Every conventional relationship has an unsigned `bigint` foreign key with a supporting index.
- Referencing and referenced columns must use identical signedness and width.
- `product_variants` are the sellable units. Every product has at least one variant. Inventory rows, cart items, and order items target variants; stock movements target the variant's inventory stock rather than `products`.
- `audit_logs.auditable_type` plus `auditable_id` and `stock_movements.reference_type` plus `reference_id` are polymorphic-style references. They receive composite indexes but cannot receive cross-table foreign keys.
- Foreign-key checks complement application validation; they do not replace authorization or lifecycle rules.

## Unique Constraints

| Table | Unique column or key | Purpose |
|---|---|---|
| `users` | `email` | Prevent duplicate normalized account emails |
| `roles` | `slug` | Stable RBAC role key |
| `permissions` | `slug` | Stable RBAC permission key |
| `role_user` | (`user_id`, `role_id`) | Prevent duplicate role assignments |
| `permission_role` | (`permission_id`, `role_id`) | Prevent duplicate permission grants |
| `customer_profiles` | `user_id` | Enforce one profile per user |
| `categories` | `slug` | Stable category URL key |
| `products` | `slug` | Stable product URL key |
| `products` | `base_sku` | Prevent duplicate non-null product-level identifiers |
| `product_attributes` | `slug` | Stable attribute key |
| `product_attribute_values` | (`product_attribute_id`, `value`) | Prevent duplicate values within an attribute |
| `product_variants` | `sku` | Globally unique sellable SKU |
| `inventory_stocks` | `product_variant_id` | One current stock row per variant |
| `carts` | `session_token` | Prevent duplicate non-null guest cart tokens |
| `cart_items` | (`cart_id`, `product_variant_id`) | One line per variant within a cart |
| `orders` | `order_number` | Stable public order identifier |
| `order_addresses` | (`order_id`, `address_type`) | At most one billing and one shipping snapshot per order |
| `payments` | (`provider`, `provider_reference`) | Prevent duplicate non-null provider transactions |
| `payments` | `idempotency_key` | Prevent duplicate processing of a retried payment command |
| `shipments` | (`carrier`, `tracking_number`) | Prevent duplicate non-null carrier tracking references |
| `coupons` | `code` | Prevent duplicate normalized coupon codes |
| `coupon_redemptions` | `order_id` | At most one redemption per order in this design |
| `product_reviews` | `order_item_id` | At most one review for a non-null purchased line |

MySQL permits multiple `NULL` values in a unique index. This is intentional for optional values such as `base_sku`, provider references, idempotency keys, session tokens, tracking numbers, and review order-item references.

## Index Strategy

Indexes should be added for known lookup, filtering, join, and chronological access patterns. Redundant single-column indexes should not be added when a suitable composite index already provides the same left-most prefix.

| Module | Table | Proposed indexes beyond primary and unique keys | Intended access pattern |
|---|---|---|---|
| Identity | `users` | (`status`, `deleted_at`), (`created_at`) | Account administration and lifecycle filtering |
| Identity | `role_user` | (`role_id`, `user_id`), (`assigned_by`) | Reverse role membership and assignment audit |
| Identity | `permission_role` | (`role_id`, `permission_id`), (`granted_by`) | Permission expansion and grant audit |
| Customer | `customer_addresses` | (`user_id`, `deleted_at`), (`user_id`, `is_default`) | Saved-address lists and default selection |
| Catalog | `categories` | (`parent_id`, `is_active`, `sort_order`), (`deleted_at`) | Hierarchy traversal and visible sibling ordering |
| Catalog | `products` | (`category_id`, `status`, `deleted_at`), (`status`, `published_at`), (`is_featured`, `status`) | Catalog lists, publication, and merchandising |
| Catalog | `product_images` | (`product_id`, `sort_order`), (`product_variant_id`, `sort_order`) | Ordered product and variant galleries |
| Catalog | `product_attribute_values` | (`product_attribute_id`, `sort_order`) | Ordered allowed values |
| Catalog | `product_variants` | (`product_id`, `status`, `deleted_at`) | Active variants for a product |
| Inventory | `inventory_stocks` | (`quantity_on_hand`, `reorder_level`) if low-stock queries justify it | Inventory monitoring; expression or generated-column indexing may be preferable after measurement |
| Inventory | `stock_movements` | (`inventory_stock_id`, `occurred_at`), (`reference_type`, `reference_id`), (`actor_user_id`, `occurred_at`) | Stock ledger, business reference, and actor history |
| Cart | `carts` | (`user_id`, `status`, `updated_at`), (`status`, `expires_at`) | Active customer cart and expiration processing |
| Cart | `cart_items` | (`product_variant_id`) | Reverse variant usage and integrity operations |
| Orders | `orders` | (`user_id`, `placed_at`), (`status`, `placed_at`), (`payment_status`, `placed_at`), (`fulfillment_status`, `placed_at`) | Customer history and operational queues |
| Orders | `order_items` | (`order_id`), (`product_id`), (`product_variant_id`) | Order loading and catalog-reference reporting |
| Orders | `order_status_histories` | (`order_id`, `created_at`), (`changed_by`, `created_at`) | Ordered lifecycle timeline and actor history |
| Payments | `payments` | (`order_id`, `status`, `created_at`), (`status`, `created_at`) | Order payment history and processing queues |
| Shipping | `shipments` | (`order_id`, `status`, `created_at`), (`status`, `shipped_at`) | Fulfillment views and shipment queues |
| Coupons | `coupons` | (`is_active`, `starts_at`, `expires_at`), (`deleted_at`) | Eligibility lookup and administration |
| Coupons | `coupon_redemptions` | (`coupon_id`, `redeemed_at`), (`user_id`, `coupon_id`, `redeemed_at`) | Global and per-user usage counts |
| Reviews | `product_reviews` | (`product_id`, `status`, `deleted_at`, `created_at`), (`user_id`, `created_at`), (`approved_by`, `approved_at`) | Published reviews, customer history, and moderation |
| Audit | `audit_logs` | (`auditable_type`, `auditable_id`, `created_at`), (`actor_user_id`, `created_at`), (`event`, `created_at`), (`request_id`) | Subject timeline, actor timeline, event search, and request tracing |

Full-text search, JSON generated-column indexes, and specialized reporting indexes are intentionally deferred until query shapes and MySQL execution plans are known.

## Check Constraints

MySQL check constraints should protect simple row-local invariants where they remain clear and stable:

- Money totals and prices are non-negative.
- Cart and order item quantities are greater than zero.
- `quantity_on_hand`, `quantity_reserved`, and `reorder_level` are non-negative, with `quantity_reserved <= quantity_on_hand` unless a later backorder policy explicitly changes the rule.
- Stock movement `quantity_after` is non-negative and the signed change agrees with the recorded before and after values for the affected quantity.
- Review ratings are integers from 1 through 5.
- Percentage coupon values are greater than zero and no more than 100; fixed discounts are greater than zero.
- Coupon and cart expiration times occur after their corresponding start or creation times when both values are present.
- Shipment `delivered_at` is not earlier than `shipped_at` when both values are present.
- A cart has at least one identity source: `user_id` or `session_token`.

Complex arithmetic, state transitions, and concurrency-sensitive rules remain application responsibilities even when a defensive database check is also practical.

## Soft Delete Strategy

| Table | Reason for soft delete | Identifier behavior |
|---|---|---|
| `users` | Preserve ownership and operational history while removing active access | Email remains reserved unless a later, explicit anonymization workflow changes it |
| `customer_addresses` | Hide obsolete saved addresses without affecting order snapshots | No globally unique customer-facing key |
| `categories` | Remove catalog visibility while preserving product context | Slug remains reserved |
| `products` | Withdraw products while retaining order and review history | Slug and non-null base SKU remain reserved |
| `product_variants` | Withdraw SKUs while retaining inventory and order references | SKU remains reserved |
| `coupons` | Retire promotions while retaining redemption history | Code remains reserved |
| `product_reviews` | Support moderation and recovery while preserving auditability | Purchased-line unique reference remains reserved |

Default application queries will later exclude rows with `deleted_at`. Administrative and historical workflows must opt in explicitly. Soft deletion does not imply that dependent historical rows should be deleted.

## Records Not Normally Deleted

The application should not normally delete `orders`, `order_items`, `payments`, `shipments`, `stock_movements`, `coupon_redemptions`, or `audit_logs`. These tables preserve financial, inventory, fulfillment, promotion, and security history. Any future legal purge or anonymization workflow must be separately designed, authorized, logged, and tested.

## Delete Behavior

The following actions describe future foreign-key behavior for hard deletes. Routine business removal still uses the soft-delete and retention rules above.

| Child foreign key | On parent delete | Rationale |
|---|---|---|
| `role_user.user_id`, `role_user.role_id` | Cascade | Pivot membership has no meaning without either parent |
| `permission_role.permission_id`, `permission_role.role_id` | Cascade | Pivot grant has no meaning without either parent |
| `role_user.assigned_by`, `permission_role.granted_by` | Set null | Keep assignment metadata row if the actor is purged |
| `customer_profiles.user_id` | Cascade | Profile has no independent business history |
| `customer_addresses.user_id` | Cascade | Saved addresses are replaced by order snapshots |
| `categories.parent_id` | Set null | Preserve child categories if a parent is hard deleted |
| `products.category_id` | Set null | Preserve product while removing category association |
| `product_images.product_id` | Cascade | Media row belongs to the product |
| `product_images.product_variant_id` | Set null | Preserve product-level image if a variant is removed |
| `product_attribute_values.product_attribute_id` | Cascade | Allowed value belongs to its definition |
| `product_variants.product_id` | Restrict | Prevent accidental product hard deletion while variants exist |
| `inventory_stocks.product_variant_id` | Restrict | Preserve current inventory ownership and movement history |
| `stock_movements.inventory_stock_id` | Restrict | Protect the stock ledger |
| `stock_movements.actor_user_id` | Set null | Preserve movement history after actor anonymization or purge |
| `carts.user_id` | Set null | Preserve or expire carts independently of user purge |
| `cart_items.cart_id` | Cascade | Cart line has no meaning without its cart |
| `cart_items.product_variant_id` | Restrict | Prevent hard deletion of a variant referenced by a live cart |
| `orders.user_id` | Set null | Keep order history and customer snapshots |
| `order_items.order_id`, `order_addresses.order_id`, `order_status_histories.order_id` | Restrict | Prevent accidental hard deletion of an order with history |
| `order_items.product_id`, `order_items.product_variant_id` | Set null | Snapshot fields preserve the historical line |
| `order_addresses.source_address_id` | Set null | Snapshot remains valid without the saved address |
| `order_status_histories.changed_by` | Set null | Preserve status history without retaining actor dependency |
| `payments.order_id`, `shipments.order_id` | Restrict | Protect financial and fulfillment records |
| `coupon_redemptions.coupon_id`, `coupon_redemptions.order_id` | Restrict | Protect promotion and order history |
| `coupon_redemptions.user_id` | Set null | Preserve redemption history after anonymization |
| `product_reviews.product_id` | Restrict | Product uses soft deletion while reviews exist |
| `product_reviews.user_id`, `product_reviews.approved_by`, `product_reviews.order_item_id` | Set null | Preserve review content and moderation history when an optional source is removed |
| `audit_logs.actor_user_id` | Set null | Preserve audit history after actor anonymization or purge |

There is no subject foreign key for audit-log or stock-movement polymorphic-style references, so delete behavior for those pairs must be handled deliberately by retention-aware application services.

`coupon_redemptions` is the only relational coupon-to-order link. Its unique `order_id` enforces at most one coupon redemption per order; no coupon foreign key or coupon index belongs on `orders`.

## Business Rules Enforced Later in Laravel

### Form Requests

- Normalize and validate email addresses, slugs, SKUs, coupon codes, country codes, currency codes, dates, and bounded status values.
- Validate required address fields by country and ensure quantities, prices, ratings, limits, and percentages are within accepted ranges.
- Reject unsupported `attributes_json`, audit subject types, and stock reference types.
- Validate that sensitive payment credentials or secrets never enter general JSON payload fields.

### Services and Transactions

- Assign only approved roles and permissions, and prevent removal of required Super Admin access.
- Keep one default saved address per user and one active cart per customer or guest context.
- Ensure every product has at least one sellable variant and create one default variant for a simple product.
- Revalidate variant status, current price, coupon eligibility, and available inventory during checkout.
- Lock inventory rows while reserving, releasing, selling, returning, or adjusting stock; append a matching stock movement in the same transaction.
- Generate collision-resistant order numbers and immutable order-item and order-address snapshots.
- Recalculate order totals server-side and verify `grand_total = subtotal - discount_total + shipping_total + tax_total` under the chosen rounding policy.
- Permit only approved order, payment, shipment, review, and coupon lifecycle transitions.
- Enforce global and per-user coupon limits transactionally and create one redemption for the completed order.
- Reconcile payment amount, currency, provider reference, and idempotency behavior with the owning order.
- Mark a review as a verified purchase only when its user, product, and order-item evidence agree.
- Sanitize audit payloads and append audit events for material administrative and financial actions.
