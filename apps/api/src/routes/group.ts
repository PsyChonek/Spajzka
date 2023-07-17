import { Group } from "src/models/group";
import { UserService } from "../services/userService";
export const groupRoutes = (server: any) => {
    const userService = new UserService(); 

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

    // Group add user to group
    server.route({
        method: 'POST',
        url: '/group/:groupId/user/:userId',
        schema: {
            tags: ['Group'],
            summary: 'Add user to group',
            params: {
                type: 'object',
                required: ['userId', 'groupId'],
                properties: {
                    userId: { type: 'string' },
                    groupId: { type: 'string' }
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
            var result = await userService.addUserToGroup(req.params.groupName, req.params.userId);

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
}