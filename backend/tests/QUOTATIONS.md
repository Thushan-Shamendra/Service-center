# Quotation verification

Run calculation and customer-access regression tests:

```sh
node --test tests/quotation.test.js
```

Run the database-backed API workflow and insert demo data:

```sh
node tests/quotation.integration.js
```

The integration script only accepts the configured `service_center_dev` database.
It uses an existing active manager and creates a dedicated inactive `Quotation Demo`
customer, `DEMO-QTN` vehicle and `JC-DEMO-QTN` job card. It retains three labelled
quotations (converted, rejected and draft) and one invoice per successful run.
It does not modify existing quotations or consume inventory. Notifications belong
to the inactive demo customer. Its generated password is random and never printed.

Checks cover creation, server-calculated totals, draft edits, invalid inputs,
submission, approval, rejection reasons, conversion field mapping and preventing
a second invoice from the same quotation.

Verified samples on 2026-09-15:

- QTN00003: converted to INV-00003, Rs. 23,600.
- QTN00004: rejected, with a saved rejection reason.
- QTN00005: editable draft, Rs. 19,470 including discounts and 18% tax.
- QTN00006: created and approved through the browser, Rs. 20,000.

Browser checks also verified draft edits, inventory selection, job-card search,
quotation search, status/amount/technician filters, and the conversion preview.
The list displays six quotations with a combined value of Rs. 125,040.

The frontend production build passes. The full TypeScript check reports existing
errors outside quotation files (`ImportMeta.env`, `setActiveRole` in the login
page, and `fetchJobCards` in the technician assignment page).

Suggested commit message:

```text
fix(quotations): align totals, editing, approval and invoice conversion
```
