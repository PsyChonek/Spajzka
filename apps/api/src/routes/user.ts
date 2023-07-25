import { Group } from "src/models/db/group";

export const userRoutes = (server: any) => {
    // create 
    server.route({
        method: 'POST',
        url: '/user',
        schema: {
            tags: ['User'],
            summary: 'Create user',
            body: {
                $ref: 'CreateInput',
            },
            response: {
                200: {
                    $ref: 'CreateOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })

    // login
    server.route({
        method: 'POST',
        url: '/user/login',
        schema: {
            tags: ['User'],
            summary: 'Login user',
            body: {
                $ref: 'LoginUserInput'
            },
            response: {
                200: {
                    $ref: 'LoginUserOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })

    // logout

    // update
    server.route({
        method: 'PUT',
        url: '/user',
        schema: {
            tags: ['User'],
            summary: 'Update user',
            body: {
                $ref: 'UpdateUserInput'
            },
            response: {
                200: {
                    $ref: 'UpdateUserOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })

    // delete
    server.route({
        method: 'DELETE',
        url: '/user/:userId',
        schema: {
            tags: ['User'],
            summary: 'Delete user by user id',
            params: {
                $ref: 'DeleteUserInput'
            },
            response: {
                200: {
                    $ref: 'DeleteUserOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })

    // get
    server.route({
        method: 'GET',
        url: '/user/:userId',
        schema: {
            tags: ['User'],
            summary: 'Get user by user id',
            params: {
                $ref: 'GetUserInput',
            },
            response: {
                200: {
                    $ref: 'GetUserOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {

        }
    })

    // get groups
    server.route({
        method: 'GET',
        url: '/user/:userId/group',
        schema: {
            tags: ['User'],
            summary: 'Get user groups',
            params: {
                $ref: 'GetUserGroupInput'
            },
            response: {
                200: {
                    $ref: 'GetUserGroupOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })

    // items
    server.route({
        method: 'GET',
        url: '/user/:userId/item',
        schema: {
            tags: ['User'],
            summary: 'Get user items by user id',
            params: {
                $ref: 'GetUserItemInput'
            },
            response: {
                200: {
                    $ref: 'GetUserItemOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {

        }
    })

    // add item
    server.route({
        method: 'POST',
        url: '/user/:userId/item',
        schema: {
            tags: ['User Item'],
            summary: 'Add item to user',
            body: {
                $ref: 'AddUserItemInput'
            },
            response: {
                200: {
                    $ref: 'AddUserItemOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })

    // remove item
    server.route({
        method: 'DELETE',
        url: '/user/:userId/item/:userItemId',
        schema: {
            tags: ['User Item'],
            summary: 'Remove user item',
            params: {
                $ref: 'RemoveUserItemInput'
            },
            response: {
                200: {
                    $ref: 'RemoveUserItemOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })

    // update item
    server.route({
        method: 'PUT',
        url: '/user/:userId/item/:userItemId',
        schema: {
            tags: ['User Item'],
            summary: 'Update user item',
            body: {
                $ref: 'UpdateUserItemInput'
            },
            response: {
                200: {
                    $ref: 'UpdateUserItemOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })
}