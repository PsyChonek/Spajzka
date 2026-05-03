import { UNIT_TABLE, normaliseUnit } from './types';
import type { UnitDef } from './types';

function defOf(unit: string): UnitDef | undefined {
  const u = normaliseUnit(unit);
  return UNIT_TABLE.find((d) => d.unit === u);
}

export function canConvert(fromUnit: string, toUnit: string): boolean {
  const a = defOf(fromUnit);
  const b = defOf(toUnit);
  return !!a && !!b && a.type === b.type;
}

export function toBase(quantity: number, unit: string): number {
  const def = defOf(unit);
  if (!def) return quantity;
  return quantity * def.factor;
}

export function fromBase(baseQuantity: number, unit: string): number {
  const def = defOf(unit);
  if (!def) return baseQuantity;
  return baseQuantity / def.factor;
}

export function convert(quantity: number, fromUnit: string, toUnit: string): number {
  const a = defOf(fromUnit);
  const b = defOf(toUnit);
  if (!a || !b) {
    if (normaliseUnit(fromUnit) === normaliseUnit(toUnit)) return quantity;
    throw new Error(`Cannot convert "${fromUnit}" to "${toUnit}"`);
  }
  if (a.type !== b.type) {
    throw new Error(
      `Cannot convert ${a.type} (${a.unit}) to ${b.type} (${b.unit})`,
    );
  }
  return (quantity * a.factor) / b.factor;
}
