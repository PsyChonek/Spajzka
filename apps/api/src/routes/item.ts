export const itemRoutes = (server: any) => {

    // Create item
    server.route({
        method: 'POST',
        url: '/item',
        schema: {
            tags: ['Item'],
            summary: 'Store item to database',
            body: {
                $ref: 'CreateItemInput'
            },
            response: {
                200: {
                    $ref: 'CreateItemOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {

        }
    })

    // Get item
    server.route({
        method: 'GET',
        url: '/item/:itemId',
        schema: {
            tags: ['Item'],
            summary: 'Get item by item id',
            params: {
                $ref: 'GetItemInput'
            },
            response: {
                200: {
                    $ref: 'GetItemOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })

    // Update item
    server.route({
        method: 'PUT',
        url: '/item',
        schema: {
            tags: ['Item'],
            summary: 'Update item',
            body: {
                $ref: 'UpdateItemInput'
            },
            response: {
                200: {
                    $ref: 'UpdateItemOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {

        }
    })

    // Delete item
    server.route({
        method: 'DELETE',
        url: '/item/:itemId',
        schema: {
            tags: ['Item'],
            summary: 'Remove item from database',
            params: {
                $ref: 'DeleteItemInput'
            },
            response: {
                200: {
                    $ref: 'DeleteItemOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {

        }
    })
}