import { createApp } from '../../src/app';

const app = createApp();

export default (req: any, res: any) => {
  const queryPath = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const querySegments = queryPath.filter(
    (segment: unknown): segment is string => typeof segment === 'string' && segment.length > 0,
  );
  const requestUrl = typeof req.url === 'string' ? req.url.split('?')[0] : '';
  const ideasIndex = requestUrl.indexOf('/ideas/');
  const urlPath = ideasIndex >= 0 ? requestUrl.slice(ideasIndex + '/ideas/'.length) : '';
  const urlSegments = urlPath.split('/').filter((segment: string) => segment.length > 0);
  const segments = querySegments.length > 0 ? querySegments : urlSegments;

  req.url = `/ideas/${segments.map((segment: string) => encodeURIComponent(segment)).join('/')}`;
  return app(req, res);
};
