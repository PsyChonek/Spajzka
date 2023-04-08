import { Item } from './models/item'

export const registerRoutes = (server: any) => {
    
    // Get items
    // server.route({
    //     method: 'GET',
    //     url: '/item',
    //     schema: {
    //         tags: ['Item'],
    //         summary: 'Get items',
    //         response: {
    //             200: {
    //                 type: 'array',
    //                 items: {
    //                     $ref: 'Item'
    //                 }
    //             }
    //         }
    //     },
    //     handler: (req: any, reply: any) => {
    //         const items: Item[] = [
    //             { id: 1, name: 'test', price: 1, isOnBuylist: true, amount: 1 },
    //             { id: 2, name: 'test2', price: 2, isOnBuylist: false, amount: 2 },
    //             { id: 3, name: 'test3', price: 3, isOnBuylist: true, amount: 3 }
    //         ]

    //         reply.send(items)
    //     }
    // })

    // Get user by id
    // server.route({
    //     method: 'GET',
    //     url: '/user/:id',
    //     schema: {
    //         tags: ['User'],
    //         summary: 'Get user by id',
    //         params: {
    //             type: 'object',
    //             properties: {
    //                 id: { type: 'number' }
    //             }
    //         },
    //         response: {
    //             200: {
    //                 $ref: 'User'
    //             }
    //         }
    //     },
    //     handler: (req: any, reply: any) => {
    //         const user = {
    //             id: 1,
    //             name: 'test'
    //         }

    //         reply.send(user)
    //     }
    // })

    // Get user items by user id
    server.route({
        method: 'GET',
        url: '/user/:id/items',
        schema: {
            tags: ['User'],
            summary: 'Get user items by user id',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        $ref: 'Item'
                    }
                }
            }
        },
        handler: (req: any, reply: any) => {
            const items: Item[] = [
                { id: 1, name: 'test user:' + req.params.id, price: 1, isOnBuylist: true, amount: 1 },
                { id: 2, name: 'test2user:' + req.params.id, price: 2, isOnBuylist: false, amount: 2 },
                { id: 3, name: 'test3user:' + req.params.id, price: 3, isOnBuylist: true, amount: 3 }
            ]

            reply.send(items)
        }
    })

    // Store item to database, response with item id
    server.route({
        method: 'POST',
        url: '/user/:id/item',
        schema: {
            tags: ['User'],
            summary: 'Store item to database',
            body: {
                $ref: 'Item'
            },
            response: {
                200: {
                    type: 'number',
                    description: 'Item id',
                }
            }
        },
        handler: (req: any, reply: any) => {
            const item: Item = req.body
            reply.send(item.id)
        }
    })
                       
}