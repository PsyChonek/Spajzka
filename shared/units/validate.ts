import { UNIT_TABLE, normaliseUnit } from './types';
import type { UnitType } from './types';

export function unitTypeOf(unit: string): UnitType {
  const u = normaliseUnit(unit);
  const def = UNIT_TABLE.find((d) => d.unit === u);
  return def ? def.type : 'custom';
}

export function allowedUnits(unitType: UnitType): string[] {
  if (unitType === 'custom') return [];
  return UNIT_TABLE.filter((d) => d.type === unitType).map((d) => d.unit);
}

export function isUnitAllowed(unit: string, unitType: UnitType): boolean {
  if (unitType === 'custom') return true;
  const u = normaliseUnit(unit);
  return UNIT_TABLE.some((d) => d.unit === u && d.type === unitType);
}
