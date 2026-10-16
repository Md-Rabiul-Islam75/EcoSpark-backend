import { createApp } from '../../src/app';

const app = createApp();

export default (req: any, res: any) => {
  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  req.url = `/ideas/${encodeURIComponent(String(slug || ''))}`;
  return app(req, res);
};
