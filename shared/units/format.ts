import { UNIT_TABLE, UNIT_TYPES, normaliseUnit } from './types';
import type { UnitType } from './types';
import { fromBase, toBase } from './convert';

export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  weight: 'Weight',
  volume: 'Volume',
  count: 'Count',
  length: 'Length',
  custom: 'Custom',
};

export const UNIT_TYPE_OPTIONS = UNIT_TYPES.map((value) => ({
  label: UNIT_TYPE_LABELS[value],
  value,
}));

export const DEFAULT_UNIT_FOR_TYPE: Record<UnitType, string> = {
  weight: 'g',
  volume: 'ml',
  count: 'pcs',
  length: 'cm',
  custom: '',
};

const MAX_DECIMALS = 2;

function trimDecimals(value: number, maxDecimals: number): string {
  if (Number.isInteger(value)) return value.toString();
  const fixed = value.toFixed(maxDecimals);
  return fixed.replace(/\.?0+$/, '');
}

function fitsDecimalBudget(value: number): boolean {
  const rounded = Number(value.toFixed(MAX_DECIMALS));
  return Math.abs(rounded - value) < 1e-9;
}

export function pickDisplayUnit(quantity: number, sourceUnit: string): string {
  const src = normaliseUnit(sourceUnit);
  const srcDef = UNIT_TABLE.find((d) => d.unit === src);
  if (!srcDef) return sourceUnit;
  const base = toBase(quantity, src);
  if (base === 0) return sourceUnit;
  const sameType = UNIT_TABLE.filter((d) => d.type === srcDef.type).slice().sort(
    (a, b) => b.factor - a.factor,
  );
  for (const candidate of sameType) {
    const value = base / candidate.factor;
    if (Math.abs(value) >= 1 && fitsDecimalBudget(value)) {
      return candidate.unit;
    }
  }
  return sourceUnit;
}

export function formatQuantity(
  quantity: number,
  unit: string,
  options: { promote?: boolean } = {},
): string {
  const u = normaliseUnit(unit);
  const target = options.promote ? pickDisplayUnit(quantity, u) : u;
  const display = target === u ? quantity : fromBase(toBase(quantity, u), target);
  return `${trimDecimals(display, MAX_DECIMALS)} ${target || ''}`.trimEnd();
}
