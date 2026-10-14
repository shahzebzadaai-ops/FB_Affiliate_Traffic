# Affiliate Traffic OS

Internal operating system for an organic-first UK dating affiliate publisher.

Shahzeb is Super Admin. Masho is the first Content Operator. The first market is the United Kingdom. The first vertical is dating affiliate publishing. Month one is 180 planned Facebook posts across five Pages.

This repository is a Phase 1 development preview. It is not production login, and it is not connected to Facebook, Google Drive or an affiliate network.

## Preview

```bash
npm install
npm test
npm run dev
```

Open the app and choose a development preview identity. There is no password.

## Documents

Future work should start with `docs/PRODUCT_MASTER.md`, `docs/DECISION_LOG.md` and `docs/BUILD_STATUS.md`. `AGENTS.md` points to the same files.

## Plan import

The month-one calendar is parsed from `data/source/uk-audience-network-plan.txt`.

```bash
npm run import:plan
```
