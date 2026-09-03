import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // bufferLogs: nada se imprime hasta que el logger de pino esté listo,
  // para no mezclar el logger default de Nest con pino durante el arranque.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);

  app.use(helmet());

  // V2 usaba cors() sin opciones -> reflejaba cualquier origen. Acá el
  // origen permitido viene de env, con un default seguro para desarrollo.
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:5173'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta cualquier campo no declarado en el DTO
      forbidNonWhitelisted: true, // rechaza el request si trae campos extra
      transform: true, // convierte payloads planos a instancias de DTO
    }),
  );

  // Versionado explícito. V2 sí tenía esto (/api/v1); se había perdido en
  // la reescritura de V3 hasta que armé el checklist de seguridad y lo
  // noté. /health queda fuera del prefijo a propósito (los health checks
  // de un load balancer no deberían depender de la versión de la API).
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  // Swagger/OpenAPI en /docs. Nota profesional: para un despliegue real en
  // producción, lo normal es gatear esto detrás de auth o deshabilitarlo por
  // completo (reduce superficie de reconocimiento). Acá queda expuesto a
  // propósito -> es un proyecto de portafolio, la documentación viva es
  // parte de lo que se quiere mostrar.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FinanceApi V3')
    .setDescription(
      'API REST de gestión financiera: usuarios, productos, compras, presupuestos, facturas y contratos de servicio.',
    )
    .setVersion('3.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('PORT', 5050);
  await app.listen(port);
}
bootstrap();
