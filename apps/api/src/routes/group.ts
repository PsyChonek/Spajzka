import { Group } from "src/models/group";
import { UserService } from "src/services/userService";

export const groupRoutes = (server: any) => {
    // Group create
    server.route({
        method: 'POST',
        url: '/group',
        schema: {
            tags: ['Group'],
            summary: 'Create group',
            body: {
                $ref: 'Group'
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var userService = new UserService();

            var result: string | null = await userService.createGroup(req.body);

            const response = {
                id: result
            }

            if (result == null)
                reply.code(500).send();
            else
                reply.send(response);
        }
    })

    // Group get

    // Group update

    // Group delete

    // Group add user
    server.route({
        method: 'POST',
        url: '/user/:userId/group/:groupName',
        schema: {
            tags: ['User'],
            summary: 'Add user to group',
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'string' },
                    groupName: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    }
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var userService = new UserService();

            var result: string | null = await userService.addUserToGroup(req.params.groupName, req.params.userId);

            const response = {
                id: result
            }

            if (result == null) {
                reply.code(500).send();
            }
            else {
                reply.send(response);
            }
        }
    })

    // Group remove user

    // Group get users
    server.route({
        method: 'GET',
        url: '/user/:userId/groups',
        schema: {
            tags: ['User'],
            summary: 'Get user groups',
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' }
                        }
                    }
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var userService = new UserService();

            var result: Group[] | null = await userService.getUserGroups(req.params.userId);

            if (result == null) {
                reply.code(500).send();
            }
            else {
                reply.send(result);
            }

        }
    })
}