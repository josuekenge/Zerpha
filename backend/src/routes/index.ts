import { Router } from 'express';

import { searchRouter } from './search.routes.js';
import { exportRouter } from './export.routes.js';
import { companyRouter } from './company.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use(searchRouter);
apiRouter.use(exportRouter);
apiRouter.use(companyRouter);

