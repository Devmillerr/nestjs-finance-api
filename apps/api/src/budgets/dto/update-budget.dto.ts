import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetDto } from './create-budget.dto';

// Update de líneas es "reemplazo completo", no parche línea por línea: si
// el cliente manda `lines`, se borran las líneas actuales y se crean las
// nuevas dentro de la misma transacción. Es el modelo más simple y
// predecible para editar un presupuesto (evita tener que soportar
// add/remove/update de líneas individuales, que no aporta valor real acá).
export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {}
