import { Db, ObjectId } from 'mongodb';
import { canConvert, convert, normaliseUnit } from '../../../shared/units';

export interface AggregatedIngredient {
  itemId: string;
  itemType: 'global' | 'group';
  itemName: string;
  unit: string;
  quantity: number;
  inPantry: number;
  toAdd: number;
  icon?: string;
  category?: string;
  defaultUnit?: string;
  unitType?: string;
}

export interface SkippedFreeText {
  recipeId: string;
  recipeName: string;
  itemName: string;
}

export interface AggregateOptions {
  /** When true (default), subtract pantry stock and return toAdd = max(0, quantity - inPantry). */
  missingOnly?: boolean;
}

export interface AggregateResult {
  aggregated: AggregatedIngredient[];
  skippedFreeText: SkippedFreeText[];
  /** _id strings of mealPlan entries in the date range, for stamping shoppingGeneratedAt. */
  entryIds: string[];
}

interface AccumulatorRow {
  itemId: string;
  /** Quantity in the row's display unit. */
  quantity: number;
  /** Display unit — either the item's defaultUnit (typed) or the first source unit (custom). */
  unit: string;
}

export async function aggregateMealPlanShopping(
  db: Db,
  groupId: ObjectId,
  fromDate: Date,
  toDate: Date,
  options?: AggregateOptions
): Promise<AggregateResult> {
  const missingOnly = options?.missingOnly !== false;

  const entries = await db.collection('mealPlan').find({
    groupId,
    cookDate: { $gte: fromDate, $lte: toDate }
  }).toArray();

  const entryIds = entries.map(e => e._id.toString());

  const recipeIds = [...new Set(entries.map(e => e.recipeId?.toString()).filter(Boolean))];
  const recipeDocs = recipeIds.length > 0
    ? await db.collection('recipes').find({
        _id: { $in: recipeIds.map(id => new ObjectId(id)) }
      }).toArray()
    : [];
  const recipeMap = new Map(recipeDocs.map(r => [r._id.toString(), r]));

  // Pre-collect all itemIds referenced by any ingredient in scope so we can
  // load item docs (with unitType) before aggregation — needed to know the
  // canonical unit each item should aggregate into.
  const candidateItemIds = new Set<string>();
  for (const entry of entries) {
    const recipe = recipeMap.get(entry.recipeId?.toString());
    if (!recipe) continue;
    for (const ing of recipe.ingredients ?? []) {
      if (ing.itemId) candidateItemIds.add(ing.itemId.toString());
    }
  }

  const itemDocs = candidateItemIds.size > 0
    ? await db.collection('items').find({
        _id: { $in: [...candidateItemIds].map(id => new ObjectId(id)) }
      }).toArray()
    : [];
  const itemMap = new Map(itemDocs.map(doc => [doc._id.toString(), doc]));

  // Accumulator keyed by `itemId` for typed items (single canonical unit per item),
  // and by `itemId::unit` for custom-typed items (no conversion possible).
  const accumulator = new Map<string, AccumulatorRow>();
  const skippedFreeText: SkippedFreeText[] = [];

  for (const entry of entries) {
    const recipe = recipeMap.get(entry.recipeId?.toString());
    if (!recipe
      || (entry.recipeType === 'group' && recipe.groupId?.toString() !== groupId.toString())
      || (entry.recipeType !== 'group' && recipe.recipeType !== 'global')
    ) {
      console.warn(`mealPlanAggregator: recipe ${entry.recipeId} not found for entry ${entry._id} — skipping ingredients`);
      continue;
    }

    const recipeServings = recipe.servings || 1;
    const scale = (entry.servings || recipeServings) / recipeServings;

    for (const ing of recipe.ingredients ?? []) {
      if (!ing.itemId) {
        skippedFreeText.push({
          recipeId: entry.recipeId.toString(),
          recipeName: entry.recipeName || recipe.name,
          itemName: ing.itemName
        });
        continue;
      }

      const itemId = ing.itemId.toString();
      const item = itemMap.get(itemId);
      const ingUnit = normaliseUnit(ing.unit) || ing.unit || '';
      const isTyped = !!item?.unitType && item.unitType !== 'custom';
      const targetUnit = isTyped ? (item!.defaultUnit as string) : ingUnit;
      const key = isTyped ? itemId : `${itemId}::${ingUnit}`;

      let qtyInTarget = ing.quantity * scale;
      if (isTyped && ingUnit && targetUnit && ingUnit !== targetUnit) {
        if (canConvert(ingUnit, targetUnit)) {
          qtyInTarget = convert(ing.quantity * scale, ingUnit, targetUnit);
        }
      }

      const existing = accumulator.get(key);
      if (existing) {
        existing.quantity += qtyInTarget;
      } else {
        accumulator.set(key, { quantity: qtyInTarget, itemId, unit: targetUnit });
      }
    }
  }

  if (accumulator.size === 0) {
    return { aggregated: [], skippedFreeText, entryIds };
  }

  let pantryMap = new Map<string, number>();
  if (missingOnly) {
    const pantryItems = await db.collection('pantry').find({
      groupId,
      itemId: { $in: [...candidateItemIds].map(id => new ObjectId(id)) }
    }).toArray();

    for (const pi of pantryItems) {
      const existing = pantryMap.get(pi.itemId.toString()) ?? 0;
      pantryMap.set(pi.itemId.toString(), existing + (pi.quantity ?? 0));
    }
  }

  const aggregated: AggregatedIngredient[] = [];

  for (const [, row] of accumulator) {
    const itemDoc = itemMap.get(row.itemId);
    const itemName = itemDoc?.name || 'Unknown Item';
    const itemType: 'global' | 'group' = itemDoc?.itemType === 'group' ? 'group' : 'global';
    const icon = itemDoc?.icon;
    const category = itemDoc?.category;
    const defaultUnit = itemDoc?.defaultUnit;
    const unitType = itemDoc?.unitType;

    let inPantry = 0;
    let toAdd = row.quantity;

    if (missingOnly) {
      // Typed rows already live in defaultUnit (so do pantry rows). Custom
      // rows match only when the source unit equals defaultUnit verbatim.
      const isTypedOrUnitMatch = (unitType && unitType !== 'custom') || row.unit === defaultUnit;
      if (isTypedOrUnitMatch) inPantry = pantryMap.get(row.itemId) ?? 0;
      toAdd = Math.max(0, row.quantity - inPantry);
    }

    aggregated.push({
      itemId: row.itemId,
      itemType,
      itemName,
      unit: row.unit,
      quantity: row.quantity,
      inPantry,
      toAdd,
      icon,
      category,
      defaultUnit,
      unitType
    });
  }

  aggregated.sort((a, b) => {
    const catA = a.category ?? '';
    const catB = b.category ?? '';
    if (catA !== catB) return catA.localeCompare(catB);
    return a.itemName.localeCompare(b.itemName);
  });

  return { aggregated, skippedFreeText, entryIds };
}
