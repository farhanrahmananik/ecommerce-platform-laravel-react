# High-Level Entity Relationship Diagram

The diagram focuses on primary ownership and major operational relationships. It intentionally omits most columns so the module boundaries remain readable.

```mermaid
erDiagram
    USERS ||--o{ ROLE_USER : receives
    ROLES ||--o{ ROLE_USER : assigns
    ROLES ||--o{ PERMISSION_ROLE : contains
    PERMISSIONS ||--o{ PERMISSION_ROLE : grants

    USERS ||--o| CUSTOMER_PROFILES : has
    USERS ||--o{ CUSTOMER_ADDRESSES : saves

    CATEGORIES o|--o{ CATEGORIES : parents
    CATEGORIES o|--o{ PRODUCTS : classifies
    PRODUCTS ||--o{ PRODUCT_IMAGES : displays
    PRODUCTS ||--|{ PRODUCT_VARIANTS : offers
    PRODUCT_VARIANTS o|--o{ PRODUCT_IMAGES : specializes
    PRODUCT_ATTRIBUTES ||--o{ PRODUCT_ATTRIBUTE_VALUES : defines

    PRODUCT_VARIANTS ||--o| INVENTORY_STOCKS : tracks
    INVENTORY_STOCKS ||--o{ STOCK_MOVEMENTS : records

    USERS o|--o{ CARTS : owns
    CARTS ||--o{ CART_ITEMS : contains
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : selected_as

    USERS o|--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS ||--|{ ORDER_ADDRESSES : snapshots
    ORDERS ||--o{ ORDER_STATUS_HISTORIES : tracks
    PRODUCTS o|--o{ ORDER_ITEMS : referenced_by
    PRODUCT_VARIANTS o|--o{ ORDER_ITEMS : referenced_by

    ORDERS ||--o{ PAYMENTS : paid_through
    ORDERS ||--o{ SHIPMENTS : fulfilled_by

    COUPONS ||--o{ COUPON_REDEMPTIONS : redeemed_as
    ORDERS ||--o| COUPON_REDEMPTIONS : records
    USERS o|--o{ COUPON_REDEMPTIONS : makes

    PRODUCTS ||--o{ PRODUCT_REVIEWS : receives
    USERS o|--o{ PRODUCT_REVIEWS : authors
    ORDER_ITEMS o|--o| PRODUCT_REVIEWS : verifies

    USERS o|--o{ AUDIT_LOGS : acts_in
```

`role_user` and `permission_role` resolve the custom RBAC many-to-many relationships. Products are catalog parents, while product variants are the sellable SKUs; even a simple product has one default variant. Product variants use `attributes_json` for selected values, so the blueprint does not introduce an unapproved variant-value pivot table. `coupon_redemptions` is the authoritative coupon-to-order link and limits an order to at most one redemption. Order items and addresses preserve checkout snapshots even when optional source references later change. `audit_logs.auditable_type` and `audit_logs.auditable_id`, plus the equivalent stock movement reference pair, are polymorphic-style references and therefore are explained in prose rather than drawn as conventional foreign keys.
