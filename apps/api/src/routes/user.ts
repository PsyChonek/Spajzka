import { UserService } from "../services/userService";
import { Group } from "src/models/db/group";
import { ItemService } from "../services/itemService";

export const userRoutes = (server: any) => {
    const userService = new UserService();

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

    // get group
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

    // get items
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
                    body: {
                        $ref: 'GetUserItemOutput'
                    }
                }
            }
        },
        handler: async (req: any, reply: any) => {

        }
    })
}