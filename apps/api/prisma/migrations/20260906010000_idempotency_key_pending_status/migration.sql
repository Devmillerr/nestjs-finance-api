-- Cierra la carrera del interceptor de idempotencia (ver
-- idempotency.interceptor.ts): antes se comprobaba "existe la key" y se
-- creaba el registro DESPUÉS de ejecutar el handler, así que dos requests
-- concurrentes con la misma key pasaban el chequeo y ejecutaban la operación
-- de negocio dos veces. Ahora la key se reserva (status = PENDING) ANTES de
-- ejecutar el handler; el UNIQUE(userId, key, route) ya existente actúa
-- como lock, así que la segunda request concurrente falla el INSERT
-- (P2002) y responde 409 en vez de duplicar la escritura.
--
-- Las filas existentes ya tienen statusCode/responseBody (fueron creadas
-- por la versión anterior, que solo insertaba al terminar con éxito), así
-- que se backfillean como COMPLETED. El código de aplicación siempre pasa
-- `status` explícito al crear, así que el DEFAULT solo importa para el
-- backfill.
CREATE TYPE "IdempotencyStatus" AS ENUM ('PENDING', 'COMPLETED');

ALTER TABLE "idempotency_keys"
  ADD COLUMN "status" "IdempotencyStatus" NOT NULL DEFAULT 'COMPLETED',
  ALTER COLUMN "statusCode" DROP NOT NULL,
  ALTER COLUMN "responseBody" DROP NOT NULL;

-- El DEFAULT 'COMPLETED' de arriba solo existió para backfillear las filas
-- existentes; a partir de acá el default vuelve a coincidir con
-- schema.prisma (@default(PENDING)) para cualquier insert que no lo
-- especifique explícitamente.
ALTER TABLE "idempotency_keys" ALTER COLUMN "status" SET DEFAULT 'PENDING';
