export interface ItemUser {
    id: string | undefined | null; // item id
    quantity: number; // quantity of item
    favoriteTier: number; // 0-5
    toBuyQuantity: number; // quantity of item to buy
    minToHave: number; // minimum quantity of item to have before is marked as "to buy"
}