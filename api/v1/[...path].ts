import { createApp } from '../../src/app';

const app = createApp();

export default (req: any, res: any) => {
  const origin = req.headers.origin;
  if (origin === 'https://eco-spark-frontend-blue.vercel.app') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const requestUrl = typeof req.url === 'string' ? req.url : '';
  const [requestPath, query = ''] = requestUrl.split('?');
  const versionedPrefix = '/api/v1/';
  const path = requestPath.startsWith(versionedPrefix)
    ? requestPath.slice(versionedPrefix.length)
    : requestPath.replace(/^\/+/, '');

  req.url = `/${path}${query ? `?${query}` : ''}`;
  return app(req, res);
};
