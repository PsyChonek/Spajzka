import { Group } from "src/models/db/group";
import { UserService } from "../services/userService";
export const groupRoutes = (server: any) => {
    const userService = new UserService();

    // create
    server.route({
        method: 'POST',
        url: '/group',
        schema: {
            tags: ['Group'],
            summary: 'Create group',
            body: {
                $ref: 'CreateGroupInput'
            },
            response: {
                200: {
                    $ref: 'CreateGroupOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {

        }
    })

    // get
    server.route({
        method: 'GET',
        url: '/group/:groupId',
        schema: {
            tags: ['Group'],
            summary: 'Get group by group id',
            params: {
                $ref: 'GetGroupInput'
            },
            response: {
                200: {
                    $ref: 'GetGroupOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })

    // update
    server.route({
        method: 'PUT',
        url: '/group',
        schema: {
            tags: ['Group'],
            summary: 'Update group',
            body: {
                $ref: 'UpdateGroupInput'
            },
            response: {
                200: {
                    $ref: 'UpdateGroupOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })

    // delete
    server.route({
        method: 'DELETE',
        url: '/group/:groupId',
        schema: {
            tags: ['Group'],
            summary: 'Delete group by group id',
            params: {
                $ref: 'DeleteGroupInput'
            },
            response: {
                200: {
                    $ref: 'DeleteGroupOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })

    // add user to group
    server.route({
        method: 'POST',
        url: '/group/:groupId/user/:userId',
        schema: {
            tags: ['Group User'],
            summary: 'Add user to group',
            params: {
                $ref: 'AddUserToGroupInput'
            },
            response: {
                200: {
                    $ref: 'AddUserToGroupOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })

    // remove user
    server.route({
        method: 'DELETE',
        url: '/group/:groupId/user/:userId',
        schema: {
            tags: ['Group User'],
            summary: 'Remove user from group',
            params: {
                $ref: 'RemoveUserFromGroupInput'
            },
            response: {
                200: {
                    $ref: 'RemoveUserFromGroupOutput'
                }
            }
        },
        handler: async (req: any, reply: any) => {
        }
    })
}