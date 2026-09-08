-- El mismo usuario no puede quedar asignado dos veces al mismo contrato de
-- servicio. No había ninguna restricción -- solo índices por columna
-- separada, que no evitan filas duplicadas.
ALTER TABLE "service_assignments" ADD CONSTRAINT "service_assignments_serviceContractId_userId_key" UNIQUE ("serviceContractId", "userId");
