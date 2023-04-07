import { Item } from './models/item'

export const registerRoutes = (server: any, schema: any) => {

    console.log()

    server.route({
        method: 'GET',
        url: '/item/:id',
        schema: {
            description: 'Get item by id',
            tags: ['item'],
            summary: 'Get item by id',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'number' }
                }
            },
            response: {
                200: schema.Item
                
            }
        },
        handler: (req: any, reply: any) => {
            reply.send()
        }
    })

    // server.post('/item', {
    //     schema: {
    //         description: 'Create item',
    //         tags: ['item'],
    //         summary: 'Create item',
    //         body: {
    //             type: 'object',
    //             properties: {
    //                 item: schema.definitions!["Item"] as JSON
    //             }
    //         },
    //         response: {
    //             200: {
    //             }
    //         }
    //     }
    // }, (req: any, reply: any) => {

    // })
}