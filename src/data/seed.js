// Демо майсторите са в базата (supabase/schema.sql, is_demo = true).
import { BATH_DEFAULT, bathroomLines, linesToQty } from "../lib/rooms/bathroom.js";

/** Примерни количества за баня 2,5 × 2 м – същите като в конфигуратора „Баня“. */
export const BATHROOM_EXAMPLE = linesToQty(bathroomLines(BATH_DEFAULT));
