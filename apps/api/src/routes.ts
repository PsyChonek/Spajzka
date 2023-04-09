import { ObjectId } from 'mongodb'
import { DatabaseService } from './databaseService'
import { Item } from './models/item'
import { ItemCollection } from './collections/itemCollection'
import { UserCollection } from './collections/userCollection'

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
        url: '/user/:key/items',
        schema: {
            tags: ['User'],
            summary: 'Get user items by user id',
            params: {
                type: 'object',
                properties: {
                    key: { type: 'string' }
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
        handler: async (req: any, reply: any) => {
            console.log('Get user items by user id', req.params.key);


            const userId = await DatabaseService.instance.getUserObjectId(req.params.key)
            if (userId == null) {
                console.log("User not found: " + userId + " (" + req.params.key + ")");
                reply.send(500);
                return;
            }

            DatabaseService.instance.client.db(process.env.DATABASE).collection('items').find({userId:userId}).toArray().then((items) => {

                console.log('Items', items);

                reply.send(items)
            }).catch((err) => {
                console.log('Error getting items', err);
                reply.send(500);
            });

        }
    })

    // Store item to database, response with item id
    server.route({
        method: 'POST',
        url: '/user/:key/item',
        schema: {
            tags: ['User'],
            summary: 'Store item to database',
            params: {
                type: 'object',
                properties: {
                    key: { type: 'string' }
                }
            },
            body: {
                $ref: 'Item'
            },
            response: {
                200: {
                    type: 'string'
                }
            }
        },
        handler: async (req: any, reply: any) => {
            const item: ItemCollection = req.body

            const userId = await DatabaseService.instance.getUserObjectId(req.params.key)
            if (userId) {
                item.userId = userId
            }
            else {
                const newUser: UserCollection = {
                    _id: undefined,
                    key: req.params.key,
                    name: req.params.key
                }

                console.log('Inserting user', newUser);

                DatabaseService.instance.client.db(process.env.DATABASE).collection('users').insertOne(newUser).then((result) => {
                    item.userId = result.insertedId
                }).catch((err) => {
                    console.log('Error inserting user', err)
                    reply.send(500)
                })
            }

            DatabaseService.instance.client.db(process.env.DATABASE).collection('items').insertOne(item).then((result) => {
                reply.send(result.insertedId)
            }).catch((err) => {
                console.log('Error inserting item', err)
                reply.send(500)
            })
        }
    })

}