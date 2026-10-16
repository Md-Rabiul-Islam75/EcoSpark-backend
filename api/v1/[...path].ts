import { createApp } from '../../src/app';

const app = createApp();

export default (req: any, res: any) => {
  const requestUrl = typeof req.url === 'string' ? req.url : '';
  const [requestPath, query = ''] = requestUrl.split('?');
  const versionedPrefix = '/api/v1/';
  const path = requestPath.startsWith(versionedPrefix)
    ? requestPath.slice(versionedPrefix.length)
    : requestPath.replace(/^\/+/, '');

  req.url = `/${path}${query ? `?${query}` : ''}`;
  return app(req, res);
};
