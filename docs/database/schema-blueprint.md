# Schema Blueprint

## Purpose

This blueprint proposes the columns and MySQL-oriented type ideas for every final business table. It is an implementation reference, not an executed schema. Exact Laravel migration syntax belongs to a later scope.

## Shared Conventions

- Primary keys are unsigned `bigint` values named `id`.
- Foreign keys are unsigned `bigint` values and are indexed.
- Money uses `decimal(10,2)`.
- Currency codes use `char(3)` and should contain uppercase ISO 4217 codes.
- Country codes use `char(2)` and should contain uppercase ISO 3166-1 alpha-2 codes.
- JSON columns hold structured metadata or deliberate snapshots, not data that requires relational joins.
- `created_at` and `updated_at` are nullable timestamps compatible with Laravel conventions.
- `deleted_at` is a nullable timestamp only on tables selected for soft deletion.

## Identity & Access

### `users`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `name` | varchar(150) | Display name |
| `email` | varchar(255) | Normalized email; unique |
| `email_verified_at` | timestamp nullable | Future verification state |
| `password` | varchar(255) | Future password hash; never plain text |
| `status` | varchar(30) | Account lifecycle state, such as active or suspended |
| `last_login_at` | timestamp nullable | Future security metadata |
| `remember_token` | varchar(100) nullable | Future Laravel-compatible persistent-login token |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |
| `deleted_at` | timestamp nullable | Soft delete marker |

### `roles`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `name` | varchar(100) | Human-readable role name |
| `slug` | varchar(100) | Stable unique key, such as `super_admin` |
| `description` | text nullable | Administrative description |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

### `permissions`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `name` | varchar(150) | Human-readable permission name |
| `slug` | varchar(150) | Stable unique permission key |
| `group_key` | varchar(100) nullable | Groups permissions by domain |
| `description` | text nullable | Administrative description |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

### `role_user`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `user_id` | bigint unsigned | Foreign key to `users.id` |
| `role_id` | bigint unsigned | Foreign key to `roles.id` |
| `assigned_by` | bigint unsigned nullable | Self-referencing foreign key to the assigning user |
| `created_at`, `updated_at` | timestamp nullable | Assignment timestamps |

The pair (`user_id`, `role_id`) is unique.

### `permission_role`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `permission_id` | bigint unsigned | Foreign key to `permissions.id` |
| `role_id` | bigint unsigned | Foreign key to `roles.id` |
| `granted_by` | bigint unsigned nullable | Foreign key to the user who granted it |
| `created_at`, `updated_at` | timestamp nullable | Grant timestamps |

The pair (`permission_id`, `role_id`) is unique.

## Customer Profile

### `customer_profiles`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `user_id` | bigint unsigned | Unique foreign key to `users.id`; enforces one profile per user |
| `phone` | varchar(32) nullable | Normalized contact number |
| `date_of_birth` | date nullable | Optional customer detail |
| `gender` | varchar(30) nullable | Optional, application-defined value |
| `avatar_path` | varchar(2048) nullable | Storage path or URL reference |
| `locale` | varchar(10) nullable | Preferred locale |
| `preferences_json` | json nullable | Non-critical customer preferences |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

### `customer_addresses`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `user_id` | bigint unsigned | Foreign key to `users.id` |
| `address_type` | varchar(20) | Billing, shipping, or other saved-address classification |
| `label` | varchar(100) nullable | Customer label, such as Home |
| `recipient_name` | varchar(150) | Addressee snapshot source |
| `company` | varchar(150) nullable | Optional company |
| `phone` | varchar(32) nullable | Delivery contact number |
| `address_line_1` | varchar(255) | Primary street line |
| `address_line_2` | varchar(255) nullable | Secondary street line |
| `city` | varchar(120) | City or locality |
| `state_region` | varchar(120) nullable | State, province, or region |
| `postal_code` | varchar(32) | Postal or ZIP code |
| `country_code` | char(2) | ISO country code |
| `is_default` | boolean | Default-address marker managed by a service transaction |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |
| `deleted_at` | timestamp nullable | Soft delete marker |

## Catalog

### `categories`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `parent_id` | bigint unsigned nullable | Self-referencing foreign key for category hierarchy |
| `name` | varchar(150) | Display name |
| `slug` | varchar(180) | Stable unique URL key |
| `description` | text nullable | Category copy |
| `image_path` | varchar(2048) nullable | Category image reference |
| `is_active` | boolean | Catalog visibility flag |
| `sort_order` | int unsigned | Sibling display order |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |
| `deleted_at` | timestamp nullable | Soft delete marker |

### `products`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `category_id` | bigint unsigned nullable | Foreign key to `categories.id` |
| `name` | varchar(200) | Product name |
| `slug` | varchar(220) | Stable unique URL key |
| `base_sku` | varchar(100) nullable | Optional unique product-level identifier |
| `brand` | varchar(150) nullable | Brand label; separate brand table is outside this design |
| `short_description` | text nullable | Listing copy |
| `description` | longtext nullable | Detailed product copy |
| `base_price` | decimal(10,2) | Catalog-level reference price; checkout always prices a variant |
| `status` | varchar(30) | Draft, active, inactive, or other bounded lifecycle state |
| `is_featured` | boolean | Merchandising flag |
| `published_at` | timestamp nullable | Publication time |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |
| `deleted_at` | timestamp nullable | Soft delete marker |

Products are catalog parents, not sellable units. Stock is intentionally absent from this table. Every product, including a simple product, must have one default `product_variants` row representing its purchasable SKU.

### `product_images`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `product_id` | bigint unsigned | Foreign key to `products.id` |
| `product_variant_id` | bigint unsigned nullable | Optional foreign key for variant-specific media |
| `disk` | varchar(50) | Storage disk identifier |
| `path` | varchar(2048) | Stored asset path |
| `alt_text` | varchar(255) nullable | Accessibility text |
| `is_primary` | boolean | Primary-image marker |
| `sort_order` | int unsigned | Display order |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

### `product_attributes`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `name` | varchar(120) | Attribute name, such as Color |
| `slug` | varchar(140) | Unique stable key |
| `display_type` | varchar(30) | UI hint such as select, swatch, or text |
| `is_filterable` | boolean | Catalog filtering flag |
| `sort_order` | int unsigned | Display order |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

### `product_attribute_values`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `product_attribute_id` | bigint unsigned | Foreign key to `product_attributes.id` |
| `value` | varchar(150) | Stable stored value |
| `display_value` | varchar(150) nullable | Optional customer-facing label |
| `sort_order` | int unsigned | Display order within the attribute |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

The pair (`product_attribute_id`, `value`) is unique.

### `product_variants`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `product_id` | bigint unsigned | Foreign key to `products.id` |
| `sku` | varchar(100) | Globally unique sellable SKU |
| `name` | varchar(200) nullable | Optional customer-facing variant label |
| `attributes_json` | json | Selected attribute values for this variant |
| `price` | decimal(10,2) | Current selling price |
| `compare_at_price` | decimal(10,2) nullable | Optional reference price |
| `weight` | decimal(10,3) nullable | Shipping weight in the configured base unit |
| `status` | varchar(30) | Variant lifecycle state |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |
| `deleted_at` | timestamp nullable | Soft delete marker |

Product variants are the only sellable units. A configurable product can have multiple variants; a simple product has exactly one default variant with an empty selected-attributes document when it has no options. Inventory, cart lines, and checkout selection resolve through the variant rather than directly through the product.

## Inventory

### `inventory_stocks`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `product_variant_id` | bigint unsigned | Unique foreign key to `product_variants.id` |
| `quantity_on_hand` | int unsigned | Physical current quantity |
| `quantity_reserved` | int unsigned | Quantity reserved for unfinished fulfillment |
| `reorder_level` | int unsigned | Low-stock threshold |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps; updates require transactional locking |

Available stock is derived as `quantity_on_hand - quantity_reserved` and is not duplicated on `products`. Each row belongs to a sellable product variant.

### `stock_movements`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `inventory_stock_id` | bigint unsigned | Foreign key to `inventory_stocks.id` |
| `actor_user_id` | bigint unsigned nullable | User responsible for the movement, when applicable |
| `movement_type` | varchar(40) | Receipt, reservation, release, sale, return, adjustment, or other bounded type |
| `quantity_change` | int | Signed change applied to on-hand or reserved quantity |
| `quantity_before` | int unsigned | Relevant quantity before the change |
| `quantity_after` | int unsigned | Relevant quantity after the change |
| `reference_type` | varchar(100) nullable | Business reference type, such as order or return |
| `reference_id` | bigint unsigned nullable | Business reference identifier |
| `reason` | varchar(255) nullable | Human-readable reason |
| `metadata_json` | json nullable | Additional structured context |
| `occurred_at` | timestamp | Domain event time |
| `created_at` | timestamp nullable | Append timestamp; no update timestamp is required |

Stock movements target the variant's `inventory_stocks` row and never target `products` directly.

## Cart

### `carts`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `user_id` | bigint unsigned nullable | Customer foreign key for an authenticated cart |
| `session_token` | char(64) nullable | Unique opaque token for a guest cart |
| `status` | varchar(30) | Active, converted, abandoned, or expired |
| `currency` | char(3) | Cart currency |
| `expires_at` | timestamp nullable | Guest or stale-cart expiration |
| `checked_out_at` | timestamp nullable | Conversion timestamp |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

An active cart must have either `user_id` or `session_token`; this cross-column rule is enforced later by application logic and, where practical, a check constraint.

### `cart_items`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `cart_id` | bigint unsigned | Foreign key to `carts.id` |
| `product_variant_id` | bigint unsigned | Foreign key to `product_variants.id` |
| `quantity` | int unsigned | Requested quantity; must be greater than zero |
| `unit_price_snapshot` | decimal(10,2) | Display and recalculation snapshot; checkout must revalidate pricing |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

The pair (`cart_id`, `product_variant_id`) is unique.

## Orders

### `orders`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `user_id` | bigint unsigned nullable | Customer foreign key; nullable for retained guest or anonymized orders |
| `order_number` | varchar(40) | Public unique order identifier |
| `status` | varchar(30) | Overall order lifecycle state |
| `payment_status` | varchar(30) | Payment lifecycle summary |
| `fulfillment_status` | varchar(30) | Fulfillment lifecycle summary |
| `currency` | char(3) | Order currency |
| `subtotal` | decimal(10,2) | Sum before order-level adjustments |
| `discount_total` | decimal(10,2) | Total discount |
| `shipping_total` | decimal(10,2) | Shipping charge |
| `tax_total` | decimal(10,2) | Tax total |
| `grand_total` | decimal(10,2) | Final order total |
| `customer_email` | varchar(255) | Checkout contact snapshot |
| `customer_phone` | varchar(32) nullable | Checkout contact snapshot |
| `customer_note` | text nullable | Customer-provided note |
| `placed_at` | timestamp | Business order time |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

Orders are retained rather than soft deleted.

### `order_items`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `order_id` | bigint unsigned | Foreign key to `orders.id` |
| `product_id` | bigint unsigned nullable | Optional catalog reference; snapshot fields remain authoritative |
| `product_variant_id` | bigint unsigned nullable | Purchased sellable unit; required when ordering and nullable only for later historical retention |
| `sku` | varchar(100) | SKU snapshot |
| `product_name` | varchar(200) | Product-name snapshot |
| `variant_name` | varchar(200) nullable | Variant-name snapshot |
| `attributes_json` | json nullable | Selected attribute snapshot |
| `unit_price` | decimal(10,2) | Charged unit-price snapshot |
| `quantity` | int unsigned | Purchased quantity; greater than zero |
| `discount_total` | decimal(10,2) | Line discount snapshot |
| `tax_total` | decimal(10,2) | Line tax snapshot |
| `line_total` | decimal(10,2) | Final line total snapshot |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

At order creation, every line targets a product variant, including the default variant of a simple product. The product reference supports catalog reporting, while the variant identifies the purchased SKU and the snapshot fields preserve history.

### `order_addresses`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `order_id` | bigint unsigned | Foreign key to `orders.id` |
| `source_address_id` | bigint unsigned nullable | Optional source reference to `customer_addresses.id` |
| `address_type` | varchar(20) | Billing or shipping; unique per order and type |
| `recipient_name` | varchar(150) | Snapshot |
| `company` | varchar(150) nullable | Snapshot |
| `phone` | varchar(32) nullable | Snapshot |
| `address_line_1` | varchar(255) | Snapshot |
| `address_line_2` | varchar(255) nullable | Snapshot |
| `city` | varchar(120) | Snapshot |
| `state_region` | varchar(120) nullable | Snapshot |
| `postal_code` | varchar(32) | Snapshot |
| `country_code` | char(2) | Snapshot |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

The snapshot remains unchanged if the source address is edited or soft deleted.

### `order_status_histories`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `order_id` | bigint unsigned | Foreign key to `orders.id` |
| `changed_by` | bigint unsigned nullable | Foreign key to `users.id` |
| `previous_status` | varchar(30) nullable | Prior state |
| `status` | varchar(30) | New state |
| `note` | text nullable | Operational context |
| `created_at` | timestamp nullable | Append timestamp |

## Payments & Shipping

### `payments`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `order_id` | bigint unsigned | Foreign key to `orders.id` |
| `provider` | varchar(50) | Payment provider key |
| `method` | varchar(50) | Card, wallet, bank transfer, cash on delivery, or other bounded method |
| `provider_reference` | varchar(191) nullable | Provider transaction identifier |
| `idempotency_key` | varchar(191) nullable | Unique retry-protection key |
| `status` | varchar(30) | Pending, authorized, captured, failed, refunded, or other bounded state |
| `amount` | decimal(10,2) | Payment or attempt amount |
| `currency` | char(3) | Payment currency |
| `failure_reason` | varchar(255) nullable | Safe operational failure summary |
| `provider_payload_json` | json nullable | Sanitized provider metadata; never raw secrets or card data |
| `paid_at` | timestamp nullable | Successful capture time |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

### `shipments`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `order_id` | bigint unsigned | Foreign key to `orders.id` |
| `carrier` | varchar(100) nullable | Carrier name or key |
| `service_level` | varchar(100) nullable | Shipping service |
| `tracking_number` | varchar(191) nullable | Carrier tracking reference |
| `status` | varchar(30) | Pending, dispatched, in transit, delivered, failed, or returned |
| `shipping_cost` | decimal(10,2) | Shipment-level cost |
| `metadata_json` | json nullable | Sanitized carrier context |
| `shipped_at` | timestamp nullable | Dispatch time |
| `delivered_at` | timestamp nullable | Delivery time |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |

## Coupons

### `coupons`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `code` | varchar(80) | Normalized unique redemption code |
| `name` | varchar(150) | Administrative name |
| `description` | text nullable | Administrative or customer-facing copy |
| `discount_type` | varchar(20) | Fixed or percentage |
| `discount_value` | decimal(10,2) | Fixed amount or percentage value interpreted by type |
| `minimum_order_amount` | decimal(10,2) nullable | Minimum eligible subtotal |
| `maximum_discount_amount` | decimal(10,2) nullable | Percentage-discount cap |
| `usage_limit` | int unsigned nullable | Global redemption limit |
| `usage_limit_per_user` | int unsigned nullable | Per-user redemption limit |
| `starts_at` | timestamp nullable | Eligibility window start |
| `expires_at` | timestamp nullable | Eligibility window end |
| `is_active` | boolean | Administrative enablement flag |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |
| `deleted_at` | timestamp nullable | Soft delete marker |

### `coupon_redemptions`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `coupon_id` | bigint unsigned | Foreign key to `coupons.id` |
| `user_id` | bigint unsigned nullable | Redeeming customer, if available |
| `order_id` | bigint unsigned | Unique foreign key to `orders.id` |
| `coupon_code` | varchar(80) | Code snapshot |
| `discount_amount` | decimal(10,2) | Applied discount snapshot |
| `redeemed_at` | timestamp | Business redemption time |
| `created_at` | timestamp nullable | Append timestamp |

`coupon_redemptions` is the authoritative coupon-to-order association. Unique `order_id` limits an order to at most one coupon redemption; `orders.discount_total` preserves the applied monetary result.

## Reviews

### `product_reviews`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `product_id` | bigint unsigned | Foreign key to `products.id` |
| `user_id` | bigint unsigned nullable | Review author; nullable after an approved anonymization process |
| `order_item_id` | bigint unsigned nullable | Optional unique purchased-line reference |
| `rating` | tinyint unsigned | Integer from 1 through 5 |
| `title` | varchar(180) nullable | Review title |
| `body` | text nullable | Review body |
| `status` | varchar(30) | Pending, approved, or rejected |
| `is_verified_purchase` | boolean | Derived from a valid order-item relationship |
| `approved_by` | bigint unsigned nullable | Moderator foreign key to `users.id` |
| `approved_at` | timestamp nullable | Moderation time |
| `created_at`, `updated_at` | timestamp nullable | Laravel timestamps |
| `deleted_at` | timestamp nullable | Soft delete marker |

## Audit Logs

### `audit_logs`

| Column | Type idea | Notes |
|---|---|---|
| `id` | bigint unsigned | Primary key |
| `actor_user_id` | bigint unsigned nullable | Foreign key to `users.id`; nullable for system activity |
| `event` | varchar(100) | Stable event key |
| `auditable_type` | varchar(191) | Polymorphic-style subject type |
| `auditable_id` | bigint unsigned | Subject identifier; intentionally has no cross-table foreign key |
| `old_values_json` | json nullable | Sanitized previous values |
| `new_values_json` | json nullable | Sanitized resulting values |
| `ip_address` | varchar(45) nullable | IPv4 or IPv6 text form |
| `user_agent` | text nullable | Request client metadata |
| `request_id` | char(36) nullable | Request correlation identifier |
| `created_at` | timestamp nullable | Immutable event timestamp |

Audit payloads must exclude passwords, tokens, payment secrets, and other sensitive values.
