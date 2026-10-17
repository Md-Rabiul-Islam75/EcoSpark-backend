import { createApp } from '../src/app';

const app = createApp();

export default (req: any, res: any) => {
  req.url = '/users/stats';
  return app(req, res);
};
