# Relationships

## Relationship Principles

- Conventional relationships use explicit foreign keys and indexes.
- Optional historical references use nullable foreign keys with snapshot columns as the durable source of truth.
- Many-to-many RBAC relationships use first-class pivot tables with their own `bigint` primary keys and unique pair constraints.
- Polymorphic-style references are limited to cases where a single record can refer to multiple table types and a conventional foreign key cannot express the relationship.

## Identity & Access

- A user belongs to many roles through `role_user`; a role belongs to many users through the same table.
- A role belongs to many permissions through `permission_role`; a permission belongs to many roles.
- `role_user.assigned_by` optionally identifies the user who assigned the role.
- `permission_role.granted_by` optionally identifies the user who granted the permission.

These are the design's two many-to-many relationships.

## Customer Profile

- A user has zero or one customer profile. `customer_profiles.user_id` is unique, making this a one-to-one relationship.
- A user has zero or many saved customer addresses.
- Saved addresses are operational input only. An order copies the selected address into `order_addresses` so later edits do not rewrite history.

## Catalog

- A category can have one parent category and many child categories through `categories.parent_id`.
- A category has many products; a product can be uncategorized if its category reference is cleared.
- A product is the catalog parent and has one or many variants and images.
- A product variant is the sellable unit and represents a purchasable SKU. Even a simple product has one default variant.
- A product image can optionally belong to a specific variant while always belonging to its product.
- A product attribute has many allowed attribute values.
- A product variant stores its selected values in `attributes_json`. No variant-to-value pivot is included in the final table list, so this JSON document is the deliberate selected-value representation.
- A product has many reviews.

## Inventory

- A product variant has zero or one inventory stock row during setup and exactly one once inventory tracking is active.
- An inventory stock row has many stock movements.
- Inventory and stock movements resolve through `inventory_stocks`, which belong to product variants; stock is never attached directly to products.
- A stock movement can optionally identify an actor user.
- `stock_movements.reference_type` and `reference_id` form a polymorphic-style business reference for an order, return, adjustment, or other future stock source. They are not foreign-key constrained.

## Cart

- A user can have many carts over time; an active-cart limit is an application-level rule.
- A guest cart has a session token instead of a user.
- A cart has many cart items.
- Cart items always target product variants. A product variant can appear in many cart items, while (`cart_id`, `product_variant_id`) remains unique within one cart.

## Orders

- A user can place many orders. The order's user reference is nullable so retained guest or approved anonymized orders remain valid.
- An order has many order items, order status history entries, payments, and shipments.
- An order has at most one billing and one shipping snapshot in `order_addresses`, enforced by a unique (`order_id`, `address_type`) constraint.
- An order item targets the purchased product variant at creation, including a simple product's default variant. Its optional retained product reference identifies the catalog parent, and its snapshot fields remain authoritative if source references are later cleared.
- An order status history entry can optionally reference the user who performed the transition.

## Payments & Shipping

- An order can have multiple payment records to support retries, partial payments, captures, or refunds without overwriting history.
- An order can have multiple shipments to support split fulfillment.
- Payments and shipments are retained operational records and do not depend on mutable catalog data.

## Coupons

- A coupon has many redemption records.
- `coupon_redemptions` is the authoritative association between coupons and orders; `orders` has no direct coupon foreign key.
- An order has at most one coupon redemption in this design, enforced by unique `coupon_redemptions.order_id`. `orders.discount_total` remains the monetary snapshot.
- A user can have many coupon redemptions; the nullable user reference supports guest checkout or later anonymization.

## Reviews

- A product has many reviews.
- A user can author many reviews.
- A review can reference one order item as verified-purchase evidence, and an order item can support at most one review.
- A review can optionally identify the user who approved it.

## Audit Logs

- A user can be the optional actor for many audit logs.
- `audit_logs.auditable_type` and `audit_logs.auditable_id` form a polymorphic-style subject reference. They can identify a user, product, order, coupon, or another approved auditable record without a direct foreign key.
- Audit logs are append-oriented. Application services must validate subject types and prevent sensitive values from entering change payloads.

## Relationship Summary

| Parent / source | Cardinality | Child / target | Relationship key | Notes |
|---|---:|---|---|---|
| `users` | many-to-many | `roles` | `role_user.user_id`, `role_user.role_id` | Unique user-role pair |
| `roles` | many-to-many | `permissions` | `permission_role.role_id`, `permission_role.permission_id` | Unique role-permission pair |
| `users` | one-to-zero-or-one | `customer_profiles` | `customer_profiles.user_id` | Unique user foreign key |
| `users` | one-to-many | `customer_addresses` | `customer_addresses.user_id` | Addresses are soft deletable |
| `categories` | one-to-many | `categories` | `categories.parent_id` | Self-referencing hierarchy |
| `categories` | one-to-many | `products` | `products.category_id` | Product relationship is optional |
| `products` | one-to-many | `product_variants` | `product_variants.product_id` | Sellable SKUs; simple products have one default variant |
| `products` | one-to-many | `product_images` | `product_images.product_id` | Images may also target a variant |
| `product_attributes` | one-to-many | `product_attribute_values` | `product_attribute_values.product_attribute_id` | Allowed catalog values |
| `product_variants` | one-to-zero-or-one | `inventory_stocks` | `inventory_stocks.product_variant_id` | Becomes one-to-one when inventory is initialized |
| `inventory_stocks` | one-to-many | `stock_movements` | `stock_movements.inventory_stock_id` | Append-oriented history |
| `users` | one-to-many | `carts` | `carts.user_id` | Optional for guest carts |
| `carts` | one-to-many | `cart_items` | `cart_items.cart_id` | Unique variant per cart |
| `product_variants` | one-to-many | `cart_items` | `cart_items.product_variant_id` | Sellable cart target |
| `users` | one-to-many | `orders` | `orders.user_id` | Optional retained customer reference |
| `orders` | one-to-many | `order_items` | `order_items.order_id` | Purchased variant and catalog snapshots |
| `orders` | one-to-many | `order_addresses` | `order_addresses.order_id` | Billing and shipping snapshots |
| `orders` | one-to-many | `order_status_histories` | `order_status_histories.order_id` | Append-oriented status trail |
| `orders` | one-to-many | `payments` | `payments.order_id` | Supports multiple attempts and transactions |
| `orders` | one-to-many | `shipments` | `shipments.order_id` | Supports split fulfillment |
| `coupons` | one-to-many | `coupon_redemptions` | `coupon_redemptions.coupon_id` | Historical usage |
| `orders` | one-to-zero-or-one | `coupon_redemptions` | `coupon_redemptions.order_id` | One redemption per order |
| `products` | one-to-many | `product_reviews` | `product_reviews.product_id` | Reviews are soft deletable |
| `order_items` | one-to-zero-or-one | `product_reviews` | `product_reviews.order_item_id` | Optional verified-purchase evidence |
| Multiple auditable tables | polymorphic-style | `audit_logs` | `auditable_type`, `auditable_id` | Indexed, application-validated, no subject FK |
