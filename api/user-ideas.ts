import { createApp } from '../src/app';

const app = createApp();

export default (req: any, res: any) => {
  req.url = '/ideas/user';
  return app(req, res);
};
