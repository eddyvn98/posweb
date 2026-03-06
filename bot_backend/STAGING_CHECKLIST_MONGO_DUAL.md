# Staging Checklist - Mongo Dual-Write (Core)

## 1) Prepare env (staging backend)
- Set `DB_PROVIDER=dual`
- Set `MONGO_URI` to Atlas staging cluster
- Set `MONGO_DB_NAME=posweb`
- Set `MONGO_CONNECT_TIMEOUT_MS=10000`
- Keep existing SQLite file mounted/persisted

## 2) Start backend and verify health
- Run: `npm run start`
- Check: `GET /health`
- Must have:
  - `provider = dual`
  - `mongo.enabled = true`
  - `mongo.connected = true`
  - `sqlite.enabled = true`

## 3) Full migration SQLite -> Mongo
- Run: `npm run migrate:mongo`
- Validate counts: `npm run verify:mongo-counts`
- If mismatch > 0, stop cutover and inspect logs

## 4) Run core smoke API test
- Run: `npm run smoke:core`
- Optional strict dual check:
  - PowerShell: `$env:SMOKE_EXPECT_DUAL='1'; npm run smoke:core`

## 5) Manual POS UI smoke (critical)
- Sales page:
  - Scan known barcode -> auto add cart item
  - Scan unknown barcode -> quick sale input price/qty
  - Complete sale -> history updated
- Products page:
  - Add/edit draft product
  - Scan barcode at product page -> open matching product for edit
  - Create new button always opens new draft

## 6) Dual-write monitoring window (24h)
- Keep `DB_PROVIDER=dual`
- Watch backend logs for `[dual] ... sqlite write failed`
- Re-run `npm run verify:mongo-counts` periodically

## 7) Promote to mongo-only (after stable)
- Backup SQLite snapshot
- Switch env: `DB_PROVIDER=mongo`
- Restart backend
- Re-check `GET /health`
- Re-run `npm run smoke:core`

## 8) Rollback
- If critical Mongo issue:
  - Set `DB_PROVIDER=sqlite`
  - Restart backend
  - Restore SQLite snapshot if needed
