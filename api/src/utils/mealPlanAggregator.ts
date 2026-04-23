import { Db, ObjectId } from 'mongodb';

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

/**
 * Aggregate all ingredients for meal-plan entries within a date range, scaled by
 * servings ratio, with optional pantry-stock subtraction.
 */
export async function aggregateMealPlanShopping(
  db: Db,
  groupId: ObjectId,
  fromDate: Date,
  toDate: Date,
  options?: AggregateOptions
): Promise<AggregateResult> {
  // Default missingOnly to true when not specified
  const missingOnly = options?.missingOnly !== false;

  // 1. Load meal-plan entries in range
  const entries = await db.collection('mealPlan').find({
    groupId,
    cookDate: { $gte: fromDate, $lte: toDate }
  }).toArray();

  const entryIds = entries.map(e => e._id.toString());

  // Accumulator: key = `${itemId}::${unit}` → { quantity, recipeId, recipeName }
  const accumulator = new Map<string, { quantity: number; itemId: string; unit: string }>();
  const skippedFreeText: SkippedFreeText[] = [];

  // 2. Batch-load recipes for all entries (one query, not N).
  const recipeIds = [...new Set(entries.map(e => e.recipeId?.toString()).filter(Boolean))];
  const recipeDocs = recipeIds.length > 0
    ? await db.collection('recipes').find({
        _id: { $in: recipeIds.map(id => new ObjectId(id)) }
      }).toArray()
    : [];
  const recipeMap = new Map(recipeDocs.map(r => [r._id.toString(), r]));

  for (const entry of entries) {
    const recipe = recipeMap.get(entry.recipeId?.toString());
    // Enforce ownership scoping the single query skipped.
    if (!recipe
      || (entry.recipeType === 'group' && recipe.groupId?.toString() !== groupId.toString())
      || (entry.recipeType !== 'group' && recipe.recipeType !== 'global')
    ) {
      console.warn(`mealPlanAggregator: recipe ${entry.recipeId} not found for entry ${entry._id} — skipping ingredients`);
      continue;
    }

    // 3. Scale factor
    const recipeServings = recipe.servings || 1;
    const scale = (entry.servings || recipeServings) / recipeServings;

    for (const ing of recipe.ingredients ?? []) {
      if (!ing.itemId) {
        // 4. Free-text ingredient — cannot add to shopping without an itemId
        skippedFreeText.push({
          recipeId: entry.recipeId.toString(),
          recipeName: entry.recipeName || recipe.name,
          itemName: ing.itemName
        });
        continue;
      }

      const key = `${ing.itemId.toString()}::${ing.unit}`;
      const existing = accumulator.get(key);
      if (existing) {
        existing.quantity += ing.quantity * scale;
      } else {
        accumulator.set(key, {
          quantity: ing.quantity * scale,
          itemId: ing.itemId.toString(),
          unit: ing.unit
        });
      }
    }
  }

  if (accumulator.size === 0) {
    return { aggregated: [], skippedFreeText, entryIds };
  }

  // 5. Load item docs for all unique itemIds in one query
  const allItemIds = [...new Set([...accumulator.values()].map(v => v.itemId))];
  const itemDocs = await db.collection('items').find({
    _id: { $in: allItemIds.map(id => new ObjectId(id)) }
  }).toArray();
  const itemMap = new Map(itemDocs.map(doc => [doc._id.toString(), doc]));

  // 6. Load pantry when missingOnly
  let pantryMap = new Map<string, number>();
  if (missingOnly) {
    const pantryItems = await db.collection('pantry').find({
      groupId,
      itemId: { $in: allItemIds.map(id => new ObjectId(id)) }
    }).toArray();

    for (const pi of pantryItems) {
      // Key: itemId string — we may have multiple pantry entries per item;
      // accumulate total stock for the same item
      const existing = pantryMap.get(pi.itemId.toString()) ?? 0;
      pantryMap.set(pi.itemId.toString(), existing + (pi.quantity ?? 0));
    }
  }

  // 7. Build output
  const aggregated: AggregatedIngredient[] = [];

  for (const [, row] of accumulator) {
    const itemDoc = itemMap.get(row.itemId);
    const itemName = itemDoc?.name || 'Unknown Item';
    const itemType: 'global' | 'group' = itemDoc?.itemType === 'group' ? 'group' : 'global';
    const icon = itemDoc?.icon;
    const category = itemDoc?.category;
    const defaultUnit = itemDoc?.defaultUnit;

    let inPantry = 0;
    let toAdd = row.quantity;

    if (missingOnly && row.unit === defaultUnit) {
      // Only subtract pantry stock when units match. Mismatched units imply a
      // different SKU concept (e.g. "ml" vs "bottle") — treat as distinct.
      inPantry = pantryMap.get(row.itemId) ?? 0;
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
      defaultUnit
    });
  }

  // 8. Sort by category then itemName for stable output
  aggregated.sort((a, b) => {
    const catA = a.category ?? '';
    const catB = b.category ?? '';
    if (catA !== catB) return catA.localeCompare(catB);
    return a.itemName.localeCompare(b.itemName);
  });

  return { aggregated, skippedFreeText, entryIds };
}
