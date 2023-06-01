export const toolRoutes = (server: any) => {

    // Check if server can connect to database¨
    server.route({
        method: 'GET',
        url: '/health',
        schema: {
            tags: ['Tools'],
            summary: 'Check if server can connect to database',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' }
                    }
                }
            }
        },
        handler: async (req: any, reply: any) => {

            var result = {
                status: "OK"
            }

            const { MongoClient, ServerApiVersion } = require('mongodb');
            const uri = process.env.CONNECTION_STRING;
            const client = new MongoClient(uri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                }
            });

            try {
                // Connect the client to the server	(optional starting in v4.7) 
                await client.connect();
                // Send a ping to confirm a successful connection
                await client.db("admin").command({ ping: 1 });
                result.status = "Pinged your deployment. You successfully connected to MongoDB!";
            }
            catch (e) {
                result.status = "Error connecting to MongoDB: " + e;
            }
            finally {
                // Ensures that the client will close when you finish/error
                await client.close();
            }


            reply.send(result);
        }
    })
}
