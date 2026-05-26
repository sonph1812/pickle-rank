import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

export const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  // Ensure the api prefix matches the Vercel route
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.init();
  return server;
};

let cachedServer: any;

export default async (req: any, res: any) => {
  console.log('[Vercel Entrypoint] Original URL:', req.url);
  console.log('[Vercel Entrypoint] Original Method:', req.method);
  console.log('[Vercel Entrypoint] Headers:', JSON.stringify(req.headers));

  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  cachedServer(req, res);
};
