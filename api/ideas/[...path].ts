import { createApp } from '../../src/app';

const app = createApp();

export default (req: any, res: any) => {
  const path = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const segments = path.filter((segment: unknown): segment is string => typeof segment === 'string' && segment.length > 0);
  req.url = `/ideas/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
  return app(req, res);
};
