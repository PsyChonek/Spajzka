import { Db, ObjectId } from 'mongodb';

export interface ShoppingItem {
  _id: string;
  groupId: string;
  itemId: string;
  itemType: string;
  quantity: number;
  completed: boolean;
  name: string;
  category?: string;
  icon?: string;
  defaultUnit?: string;
  mealPlanRefs?: Array<{ mealPlanId?: string; batchId: string }>;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertShoppingItemInput {
  itemId: string;
  itemType: 'global' | 'group';
  quantity: number;
  /** Optional link to a meal-plan batch. mealPlanId is omitted when a row aggregates multiple entries. */
  mealPlanRef?: { mealPlanId?: ObjectId; batchId: string };
}

/**
 * Insert a single item into the shopping collection and return the populated doc.
 * Shared between the shopping POST route and the meal-plan generate-shopping endpoint.
 */
export async function insertShoppingItem(
  db: Db,
  groupId: ObjectId,
  input: InsertShoppingItemInput
): Promise<ShoppingItem> {
  const { itemId, itemType, quantity, mealPlanRef } = input;

  const item = await db.collection('items').findOne({
    _id: new ObjectId(itemId),
    itemType
  });

  if (!item) {
    const err: any = new Error(`${itemType} item not found`);
    err.statusCode = 404;
    err.code = 'ITEM_NOT_FOUND';
    throw err;
  }

  const newDoc: any = {
    groupId,
    itemId: new ObjectId(itemId),
    itemType,
    quantity,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (mealPlanRef) {
    newDoc.mealPlanRefs = [
      mealPlanRef.mealPlanId
        ? { mealPlanId: mealPlanRef.mealPlanId, batchId: mealPlanRef.batchId }
        : { batchId: mealPlanRef.batchId }
    ];
  }

  const result = await db.collection('shopping').insertOne(newDoc);

  return {
    ...newDoc,
    _id: result.insertedId.toString(),
    groupId: groupId.toString(),
    itemId: itemId,
    name: item.name || 'Unknown Item',
    category: item.category,
    icon: item.icon,
    defaultUnit: item.defaultUnit,
    mealPlanRefs: newDoc.mealPlanRefs?.map((r: any) => ({
      ...(r.mealPlanId ? { mealPlanId: r.mealPlanId.toString() } : {}),
      batchId: r.batchId
    }))
  } as ShoppingItem;
}
