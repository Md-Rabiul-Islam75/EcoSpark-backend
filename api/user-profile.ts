import { createApp } from '../src/app';

const app = createApp();

export default (req: any, res: any) => {
  req.url = '/api/v1/users/profile';
  return app(req, res);
};
