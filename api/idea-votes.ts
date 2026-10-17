import { createApp } from '../src/app';

const app = createApp();

export default (req: any, res: any) => {
  const ideaId = Array.isArray(req.query.ideaId) ? req.query.ideaId[0] : req.query.ideaId;
  req.url = `/ideas/${encodeURIComponent(String(ideaId || ''))}/votes`;
  return app(req, res);
};
