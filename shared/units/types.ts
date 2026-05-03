export type UnitType = 'weight' | 'volume' | 'count' | 'length' | 'custom';

export interface UnitDef {
  unit: string;
  factor: number;
  type: Exclude<UnitType, 'custom'>;
}

export const UNIT_TABLE: ReadonlyArray<UnitDef> = [
  { unit: 'mg', factor: 0.001, type: 'weight' },
  { unit: 'g', factor: 1, type: 'weight' },
  { unit: 'dkg', factor: 10, type: 'weight' },
  { unit: 'kg', factor: 1000, type: 'weight' },
  { unit: 'ml', factor: 1, type: 'volume' },
  { unit: 'cl', factor: 10, type: 'volume' },
  { unit: 'dl', factor: 100, type: 'volume' },
  { unit: 'l', factor: 1000, type: 'volume' },
  { unit: 'pcs', factor: 1, type: 'count' },
  { unit: 'cm', factor: 1, type: 'length' },
  { unit: 'm', factor: 100, type: 'length' },
];

export const UNIT_TYPES: ReadonlyArray<UnitType> = [
  'weight',
  'volume',
  'count',
  'length',
  'custom',
];

const ALIAS_MAP: Record<string, string> = {
  L: 'l',
  KG: 'kg',
  Kg: 'kg',
  G: 'g',
  MG: 'mg',
  Mg: 'mg',
  ML: 'ml',
  Ml: 'ml',
  CL: 'cl',
  DL: 'dl',
  DKG: 'dkg',
  Dkg: 'dkg',
  PCS: 'pcs',
  Pcs: 'pcs',
  ks: 'pcs',
  KS: 'pcs',
  Ks: 'pcs',
  piece: 'pcs',
  pieces: 'pcs',
  CM: 'cm',
  Cm: 'cm',
  M: 'm',
};

export function normaliseUnit(input: string | undefined | null): string {
  if (!input) return '';
  const trimmed = String(input).trim();
  if (!trimmed) return '';
  if (ALIAS_MAP[trimmed]) return ALIAS_MAP[trimmed];
  const lower = trimmed.toLowerCase();
  if (UNIT_TABLE.some((u) => u.unit === lower)) return lower;
  return trimmed;
}
