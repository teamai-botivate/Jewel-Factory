import { Hono } from 'hono';

import { getStoreDashboard } from '@/lib/db/store-dashboard';
import { getIntelligenceSummary, getRecommendations } from '@/lib/db/intelligence';
import {
  getKioskOrdersByStore, getKioskOrderForStore, approveKioskOrder, rejectKioskOrder,
  getB2bOrdersByStore, getB2bOrderForStore, approveB2bOrder, rejectB2bOrder,
} from '@/lib/db/orders';
import {
  listCustomRequests, getCustomRequestForStore, forwardCustomRequest, rejectCustomRequest,
} from '@/lib/db/custom-design';
import { sendData, sendError } from '../envelope';
import { managerGuard, approverIdOrNull, type AppEnv } from '../guards';

// Operational store routes — accessible to OWNER or MANAGER (managerGuard).
export const storeOpsRoutes = new Hono<AppEnv>();
storeOpsRoutes.use('*', managerGuard);

// ── Dashboard + Intelligence ──────────────────────────────────────────────────
storeOpsRoutes.get('/dashboard', async (c) => {
  return sendData(c, await getStoreDashboard(c.get('storeId')));
});
storeOpsRoutes.get('/intelligence/summary', async (c) => {
  return sendData(c, await getIntelligenceSummary(c.get('storeId')));
});
storeOpsRoutes.get('/intelligence/recommendations', async (c) => {
  return sendData(c, await getRecommendations(c.get('storeId')));
});

// ── Kiosk orders ──────────────────────────────────────────────────────────────
storeOpsRoutes.get('/kiosk-orders', async (c) => {
  return sendData(c, await getKioskOrdersByStore(c.get('storeId')));
});
storeOpsRoutes.get('/kiosk-orders/pending', async (c) => {
  return sendData(c, await getKioskOrdersByStore(c.get('storeId'), true));
});
storeOpsRoutes.get('/kiosk-orders/:id', async (c) => {
  const o = await getKioskOrderForStore(c.get('storeId'), c.req.param('id'));
  if (!o) return sendError(c, 'not_found', 'Order not found', 404);
  return sendData(c, o);
});
storeOpsRoutes.post('/kiosk-orders/:id/approve', async (c) => {
  const ok = await approveKioskOrder(c.get('storeId'), c.req.param('id'), approverIdOrNull(c));
  if (!ok) return sendError(c, 'not_found', 'Order not found', 404);
  return sendData(c, { ok: true });
});
storeOpsRoutes.post('/kiosk-orders/:id/reject', async (c) => {
  const ok = await rejectKioskOrder(c.get('storeId'), c.req.param('id'));
  if (!ok) return sendError(c, 'not_found', 'Order not found', 404);
  return sendData(c, { ok: true });
});

// ── B2B orders ────────────────────────────────────────────────────────────────
storeOpsRoutes.get('/b2b-orders', async (c) => {
  return sendData(c, await getB2bOrdersByStore(c.get('storeId')));
});
storeOpsRoutes.get('/b2b-orders/pending', async (c) => {
  return sendData(c, await getB2bOrdersByStore(c.get('storeId'), true));
});
storeOpsRoutes.get('/b2b-orders/:id', async (c) => {
  const o = await getB2bOrderForStore(c.get('storeId'), c.req.param('id'));
  if (!o) return sendError(c, 'not_found', 'Order not found', 404);
  return sendData(c, o);
});
storeOpsRoutes.post('/b2b-orders/:id/approve', async (c) => {
  const ok = await approveB2bOrder(c.get('storeId'), c.req.param('id'), approverIdOrNull(c));
  if (!ok) return sendError(c, 'not_found', 'Order not found', 404);
  return sendData(c, { ok: true });
});
storeOpsRoutes.post('/b2b-orders/:id/reject', async (c) => {
  const ok = await rejectB2bOrder(c.get('storeId'), c.req.param('id'));
  if (!ok) return sendError(c, 'not_found', 'Order not found', 404);
  return sendData(c, { ok: true });
});

// ── Custom designs ────────────────────────────────────────────────────────────
storeOpsRoutes.get('/custom-designs', async (c) => {
  return sendData(c, await listCustomRequests(c.get('storeId')));
});
storeOpsRoutes.post('/custom-designs/:id/approve', async (c) => {
  const req = await getCustomRequestForStore(c.get('storeId'), c.req.param('id'));
  if (!req) return sendError(c, 'not_found', 'Request not found', 404);
  const result = await forwardCustomRequest(c.get('storeId'), c.req.param('id'), approverIdOrNull(c));
  if (!result.ok) {
    if (result.reason === 'no_manufacturer') {
      return sendError(c, 'bad_request', 'Store is not linked to a manufacturer yet.', 400);
    }
    return sendError(c, 'not_found', 'Request not found', 404);
  }
  return sendData(c, { ok: true });
});
storeOpsRoutes.post('/custom-designs/:id/reject', async (c) => {
  const ok = await rejectCustomRequest(c.get('storeId'), c.req.param('id'), approverIdOrNull(c));
  if (!ok) return sendError(c, 'not_found', 'Request not found', 404);
  return sendData(c, { ok: true });
});
