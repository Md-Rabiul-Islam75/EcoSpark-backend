import { createApp } from '../src/app';

const app = createApp();

export default (req: any, res: any) => {
  req.url = '/api/v1/ideas/user';
  return app(req, res);
};
