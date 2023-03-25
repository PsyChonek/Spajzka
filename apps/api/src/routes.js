"use strict";
exports.__esModule = true;
exports.registerRoutes = void 0;
var shared_1 = require("shared");
var registerRoutes = function (server, schema) {
    server.get('/item', {
        schema: {
            description: 'Get item',
            tags: ['item'],
            summary: 'Get item',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        item: schema.definitions[shared_1.Item.name]
                    }
                }
            }
        }
    }, function (req, reply) {
        reply.send({ item: new shared_1.Item() });
    });
};
exports.registerRoutes = registerRoutes;
