import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    // Load config globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Connect to MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        return { uri };
      },
      inject: [ConfigService],
    }),
    // Serve static files from 'public' folder
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
    // Business logic modules
    TeamsModule,
  ],
})
export class AppModule {}

