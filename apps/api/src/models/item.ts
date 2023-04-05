export class Item {
    id: number = 0;
    name: string = '';
    price: number = 0;
    quantity: number = 0;
    description: string = '';

    constructor() {
        this.id = 1;
        this.name = 'Item 1';
        this.price = 1.99;
        this.quantity = 10;
        this.description = 'Item 1 description';
    }
}