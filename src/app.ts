import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { env } from './config/env';
import { errorHandler, notFound } from './middlewares/errorHandler';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 }));
  app.use(hpp());
  app.use(cookieParser());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(
    express.json({
      limit: '5mb',
      verify: (req, _res, buf) => {
        (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'EcoSpark Hub API is running' });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'EcoSpark Hub API is running' });
  });

  app.use('/api/v1', routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
