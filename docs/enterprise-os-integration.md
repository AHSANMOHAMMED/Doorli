# Doorli and Doorli-Enterprise-OS Integration Contract

Doorli is the marketplace and full-stack product repository. Doorli-Enterprise-OS is the isolated ERPNext/Frappe system for enterprise vendors. They must remain separate deployments and separate databases; they integrate through authenticated HTTP webhooks and asynchronous status callbacks.

## Runtime configuration

| System | Variable | Required value |
|---|---|---|
| Doorli | `ERP_ENTERPRISE_URL` | `https://enterprise.doorli.me/api/method/doorli_core.api.create_order` |
| Doorli | `ERP_ENTERPRISE_PROVISION_URL` | Optional explicit URL ending in `doorli_core.api.provision_vendor` |
| Doorli | `ERP_INTERNAL_SECRET` | Same secret as Enterprise OS `DOORLI_WEBHOOK_SECRET` |
| Enterprise OS | `DOORLI_WEBHOOK_SECRET` | Same secret as Doorli `ERP_INTERNAL_SECRET` |
| Enterprise OS | `DOORLI_MARKETPLACE_ORDER_STATUS_URL` | Doorli `https://doorli.me/api/v1/erp-webhooks/order-status` endpoint |

Secrets must be supplied through deployment secret management. They must not be committed to either repository.

## Request flows

Doorli provisions a vendor by calling `doorli_core.api.provision_vendor`, then stores the returned ERPNext Company name as the vendor ERP tenant identifier. Marketplace orders for enterprise vendors call `doorli_core.api.create_order`; the `marketplace_order_id` is used as the idempotency key and as the ERPNext Sales Order `po_no`.

Doorli sends the shared secret in the `X-Doorli-Secret` header. The Enterprise app also accepts a Bearer-form `Authorization` header for backwards compatibility. Enterprise OS sends reverse lifecycle updates to Doorli using `Authorization: Bearer <shared-secret>` and the JSON fields `marketplace_order_id`, `erp_order_id`, `status`, and `vendor_company`.

## Supported Enterprise endpoints

| Endpoint | Purpose |
|---|---|
| `provision_vendor` | Idempotently creates an isolated ERPNext Company and optional vendor user permission |
| `create_order` | Idempotently creates and submits an ERPNext Sales Order |
| `update_order_status` | Accepts marketplace status callbacks for an existing Sales Order |
| `api/resource/Stock Ledger Entry` | Inventory lookup used by the Doorli shared ERP client |

The Enterprise status callback accepts `confirmed`, `processing`, `delivered`, `completed`, and `cancelled`. Repeated updates are safe; each accepted update is recorded as an ERPNext comment, and cancellation invokes the ERPNext cancellation workflow.

## Deployment rule

Do not add the Enterprise database to Doorli’s marketplace Docker Compose stack. Deploy Enterprise OS on its isolated node and expose only the HTTPS webhook surface required by the contract. Validate both directions after deployment: Doorli must be able to provision a test Company and submit an idempotent test order, while Enterprise OS must be able to deliver an order-status callback to Doorli.
