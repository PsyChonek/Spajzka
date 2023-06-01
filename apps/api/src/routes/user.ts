import { User } from "src/models/user";
import { UserService } from "src/services/userService";

export const userRoutes = (server: any) => {
    
    // User create 
    server.route({
        method: 'POST',
        url: '/user',
        schema: {
            tags: ['User'],
            summary: 'Create user',
            body: {
                $ref: 'User'
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

            var result: string | null = await userService.createUser(req.body);

            const response = {
                id: result
            }

            if (result == null)
                reply.code(500).send();
            else
                reply.send(response);
        }
    })

    // User login


    // User logout

    // User update

    // User delete

    // User get

    // User find
    server.route({
        method: 'GET',
        url: '/user/:userName',
        schema: {
            tags: ['User'],
            summary: 'Get user by user name',
            params: {
                type: 'object',
                properties: {
                    userName: { type: 'string' }
                }
            },
            response: {
                200: {
                    $ref: 'User'
                }
            }
        },
        handler: async (req: any, reply: any) => {
            var userService = new UserService();

            var user: User | null = await userService.getUserByName(req.params.userName);

            if (user == null) {
                reply.code(500).send();
                return;
            }
            else {
                reply.send(user);
            }
        }
    })
}