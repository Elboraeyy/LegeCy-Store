# Safe Ledger Report

GeneratedAt: 2026-06-02T14:50:04.499Z

## What this report is
This report explains how the **mobile admin Treasury "Total Balance"** number is formed: it is the sum of **`Safe.balance`** across safes.
It reconstructs each safe balance from **`SafeTransaction`** history and highlights any mismatches that can cause an incorrect total.

## Totals (all safes)
- DB total (sum of Safe.balance): **EGP 20,750.72**
- Recomputed from SafeTransaction: **EGP 20,750.72**
- Total difference (DB - recomputed): **EGP 0.00**

## Per-safe summaries
### Cash (CASH)
- SafeId: `caf3be7a-8fcd-449b-922e-90c12d1f64b9`
- Active: **YES**
- SafeCreatedAt: 2026-05-19T07:55:53.729Z
- Opening inferred: **EGP 0.00**
- Total CREDIT (in): **EGP 64,203.18**
- Total DEBIT (out): **EGP 43,452.46**
- Net TRANSFER: **EGP 0.00**
- Ending recomputed: **EGP 20,750.72**
- Ending DB (Safe.balance): **EGP 20,750.72**
- Ending diff (DB - recomputed): **EGP 0.00**
- Transactions: **85**
- FirstTxAt: 2026-01-01T00:00:00.000Z
- LastTxAt: 2026-06-02T14:46:54.861Z
- BalanceAfter mismatches inside history: **49**

### Bank Account (NBE) (BANK)
- SafeId: `ccf9a32b-7060-4734-b7a1-2e4c8e7c5737`
- Active: **YES**
- SafeCreatedAt: 2026-05-19T07:55:50.969Z
- Opening inferred: **EGP 0.00**
- Total CREDIT (in): **EGP 0.00**
- Total DEBIT (out): **EGP 0.00**
- Net TRANSFER: **EGP 0.00**
- Ending recomputed: **EGP 0.00**
- Ending DB (Safe.balance): **EGP 0.00**
- Ending diff (DB - recomputed): **EGP 0.00**
- Transactions: **0**
- FirstTxAt: —
- LastTxAt: —
- BalanceAfter mismatches inside history: **0**

### E-Wallet (WALLET)
- SafeId: `96a09df7-b102-4283-ae46-04edafa92076`
- Active: **YES**
- SafeCreatedAt: 2026-05-19T07:55:53.948Z
- Opening inferred: **EGP 0.00**
- Total CREDIT (in): **EGP 0.00**
- Total DEBIT (out): **EGP 0.00**
- Net TRANSFER: **EGP 0.00**
- Ending recomputed: **EGP 0.00**
- Ending DB (Safe.balance): **EGP 0.00**
- Ending diff (DB - recomputed): **EGP 0.00**
- Transactions: **0**
- FirstTxAt: —
- LastTxAt: —
- BalanceAfter mismatches inside history: **0**

### Meeza Card (WALLET)
- SafeId: `70af542e-0e73-4748-8d1b-7e8313c91091`
- Active: **YES**
- SafeCreatedAt: 2026-06-02T07:09:02.157Z
- Opening inferred: **EGP 0.00**
- Total CREDIT (in): **EGP 0.00**
- Total DEBIT (out): **EGP 0.00**
- Net TRANSFER: **EGP 0.00**
- Ending recomputed: **EGP 0.00**
- Ending DB (Safe.balance): **EGP 0.00**
- Ending diff (DB - recomputed): **EGP 0.00**
- Transactions: **0**
- FirstTxAt: —
- LastTxAt: —
- BalanceAfter mismatches inside history: **0**

### EasyPay Card (Egyptian Post) (WALLET)
- SafeId: `ef900d2c-4e91-413f-b22e-2408d45eef48`
- Active: **YES**
- SafeCreatedAt: 2026-06-02T07:09:06.491Z
- Opening inferred: **EGP 0.00**
- Total CREDIT (in): **EGP 0.00**
- Total DEBIT (out): **EGP 0.00**
- Net TRANSFER: **EGP 0.00**
- Ending recomputed: **EGP 0.00**
- Ending DB (Safe.balance): **EGP 0.00**
- Ending diff (DB - recomputed): **EGP 0.00**
- Transactions: **0**
- FirstTxAt: —
- LastTxAt: —
- BalanceAfter mismatches inside history: **0**

## Potential problems found
The following safes show internal inconsistencies that can produce wrong totals:

- **Cash** (CASH): endingDiff=EGP 0.00, txMismatches=49, txCount=85

## Output files
- Timeline CSV: E:\Dev\web\LegaCy\reports\safe-ledger-timeline-20260602-175004.csv
- Summary JSON: E:\Dev\web\LegaCy\reports\safe-ledger-summary-20260602-175004.json

## Notes on where Safe balances change in code
Safe balances are updated (and SafeTransaction created) by these flows:
- Orders audit: credit safe by order revenue (referenceType=ORDER)
- Expenses: debit safe by expense amount (referenceType=EXPENSE)
- Partner withdrawals approval: debit safe (referenceType=WITHDRAWAL)
- Month closing: credit/debit brand reinvestment (referenceType=MONTH_CLOSING)
- Manual transfers / initial balances via safes API (referenceType=TRANSFER / DEPOSIT)
