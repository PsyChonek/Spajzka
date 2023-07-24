import { UserService } from "../services/userService";
import { Group } from "src/models/db/group";
import { ItemService } from "../services/itemService";

export const userRoutes = (server: any) => {
    const userService = new UserService();

    // User create 
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

    // User login

    // User logout

    // User update

    // User delete

    // User get
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

    // Users get group
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

    // User get items
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