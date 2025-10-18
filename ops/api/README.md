# EF OPS (module à déposer dans EF-BAKERY/ops)

## Lancer en local
```bash
cd ops/api
cp .env.example .env
npm i
npm run migrate
npm run seed
npm run dev
```

Endpoints clés :
- `GET /api/orders?date=YYYY-MM-DD&shop_id=1`
- `POST /api/orders` { shop_id, date, items:[{product_id, quantity}] }
- `POST /api/orders/:id/validate`
- `GET /api/production/aggregate?date=YYYY-MM-DD&shop_id=1`
- `POST /api/stocks/move` { kind:'in'|'out', scope:'raw'|'finished', item_id, qty, reason?, ref_date? }
- `GET /api/stocks/level?scope=finished&item_id=1`
- `POST /api/losses` { shop_id, product_id, qty, reason?, loss_date? }
- `POST /api/returns` { shop_id, product_id, qty, return_date? }
- `GET /api/metrics?start=YYYY-MM-DD&end=YYYY-MM-DD`
