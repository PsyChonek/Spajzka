"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterRoutes = RegisterRoutes;
const runtime_1 = require("@tsoa/runtime");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const UserController_1 = require("./../controllers/UserController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const ItemController_1 = require("./../controllers/ItemController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const HealthController_1 = require("./../controllers/HealthController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const GroupController_1 = require("./../controllers/GroupController");
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const AuthController_1 = require("./../controllers/AuthController");
const AuthMiddleware_1 = require("./../middleware/AuthMiddleware");
const expressAuthenticationRecasted = AuthMiddleware_1.expressAuthentication;
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const models = {
    "UserDto": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "username": { "dataType": "string", "required": true },
            "displayName": { "dataType": "string", "required": true },
            "accessCode": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateUserDto": {
        "dataType": "refObject",
        "properties": {
            "username": { "dataType": "string" },
            "displayName": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ItemDto": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "name": { "dataType": "string", "required": true },
            "isOnBuylist": { "dataType": "boolean", "required": true },
            "amount": { "dataType": "double", "required": true },
            "price": { "dataType": "double", "required": true },
            "groupId": { "dataType": "string", "required": true },
            "userId": { "dataType": "string", "required": true },
            "createdAt": { "dataType": "datetime" },
            "updatedAt": { "dataType": "datetime" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GroupDto": {
        "dataType": "refObject",
        "properties": {
            "id": { "dataType": "string", "required": true },
            "name": { "dataType": "string", "required": true },
            "description": { "dataType": "string" },
            "userIds": { "dataType": "array", "array": { "dataType": "string" }, "required": true },
            "createdAt": { "dataType": "datetime" },
            "updatedAt": { "dataType": "datetime" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateItemDto": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string", "required": true },
            "isOnBuylist": { "dataType": "boolean" },
            "amount": { "dataType": "double" },
            "price": { "dataType": "double" },
            "groupId": { "dataType": "string", "required": true },
            "userId": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateItemDto": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string" },
            "isOnBuylist": { "dataType": "boolean" },
            "amount": { "dataType": "double" },
            "price": { "dataType": "double" },
            "groupId": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateGroupDto": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string", "required": true },
            "description": { "dataType": "string" },
            "userIds": { "dataType": "array", "array": { "dataType": "string" } },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateGroupDto": {
        "dataType": "refObject",
        "properties": {
            "name": { "dataType": "string" },
            "description": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddUserToGroupDto": {
        "dataType": "refObject",
        "properties": {
            "userId": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateUserDto": {
        "dataType": "refObject",
        "properties": {
            "username": { "dataType": "string", "required": true },
            "displayName": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TokenResponseDto": {
        "dataType": "refObject",
        "properties": {
            "token": { "dataType": "string", "required": true },
            "expiresIn": { "dataType": "double", "required": true },
            "user": { "ref": "UserDto", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginDto": {
        "dataType": "refObject",
        "properties": {
            "accessCode": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResetAccessCodeResponseDto": {
        "dataType": "refObject",
        "properties": {
            "accessCode": { "dataType": "string", "required": true },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpgradeGuestDto": {
        "dataType": "refObject",
        "properties": {
            "username": { "dataType": "string", "required": true },
            "displayName": { "dataType": "string" },
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new runtime_1.ExpressTemplateService(models, { "noImplicitAdditionalProperties": "throw-on-extras", "bodyCoercion": true });
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
function RegisterRoutes(app) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
    const argsUserController_getAllUsers = {};
    app.get('/users', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.getAllUsers)), async function UserController_getAllUsers(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getAllUsers, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'getAllUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_getUser = {
        userId: { "in": "path", "name": "userId", "required": true, "dataType": "string" },
    };
    app.get('/users/:userId', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.getUser)), async function UserController_getUser(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUser, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'getUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_updateUser = {
        userId: { "in": "path", "name": "userId", "required": true, "dataType": "string" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "UpdateUserDto" },
    };
    app.put('/users/:userId', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.updateUser)), async function UserController_updateUser(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_updateUser, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'updateUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_deleteUser = {
        userId: { "in": "path", "name": "userId", "required": true, "dataType": "string" },
    };
    app.delete('/users/:userId', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.deleteUser)), async function UserController_deleteUser(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_deleteUser, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'deleteUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 204,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_getUserItems = {
        userId: { "in": "path", "name": "userId", "required": true, "dataType": "string" },
    };
    app.get('/users/:userId/items', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.getUserItems)), async function UserController_getUserItems(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUserItems, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'getUserItems',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsUserController_getUserGroups = {
        userId: { "in": "path", "name": "userId", "required": true, "dataType": "string" },
    };
    app.get('/users/:userId/groups', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController)), ...((0, runtime_1.fetchMiddlewares)(UserController_1.UserController.prototype.getUserGroups)), async function UserController_getUserGroups(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUserGroups, request, response });
            const controller = new UserController_1.UserController();
            await templateService.apiHandler({
                methodName: 'getUserGroups',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsItemController_getAllItems = {};
    app.get('/items', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(ItemController_1.ItemController)), ...((0, runtime_1.fetchMiddlewares)(ItemController_1.ItemController.prototype.getAllItems)), async function ItemController_getAllItems(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsItemController_getAllItems, request, response });
            const controller = new ItemController_1.ItemController();
            await templateService.apiHandler({
                methodName: 'getAllItems',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsItemController_getItem = {
        itemId: { "in": "path", "name": "itemId", "required": true, "dataType": "string" },
    };
    app.get('/items/:itemId', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(ItemController_1.ItemController)), ...((0, runtime_1.fetchMiddlewares)(ItemController_1.ItemController.prototype.getItem)), async function ItemController_getItem(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsItemController_getItem, request, response });
            const controller = new ItemController_1.ItemController();
            await templateService.apiHandler({
                methodName: 'getItem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsItemController_createItem = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "CreateItemDto" },
    };
    app.post('/items', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(ItemController_1.ItemController)), ...((0, runtime_1.fetchMiddlewares)(ItemController_1.ItemController.prototype.createItem)), async function ItemController_createItem(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsItemController_createItem, request, response });
            const controller = new ItemController_1.ItemController();
            await templateService.apiHandler({
                methodName: 'createItem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsItemController_updateItem = {
        itemId: { "in": "path", "name": "itemId", "required": true, "dataType": "string" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "UpdateItemDto" },
    };
    app.put('/items/:itemId', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(ItemController_1.ItemController)), ...((0, runtime_1.fetchMiddlewares)(ItemController_1.ItemController.prototype.updateItem)), async function ItemController_updateItem(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsItemController_updateItem, request, response });
            const controller = new ItemController_1.ItemController();
            await templateService.apiHandler({
                methodName: 'updateItem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsItemController_deleteItem = {
        itemId: { "in": "path", "name": "itemId", "required": true, "dataType": "string" },
    };
    app.delete('/items/:itemId', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(ItemController_1.ItemController)), ...((0, runtime_1.fetchMiddlewares)(ItemController_1.ItemController.prototype.deleteItem)), async function ItemController_deleteItem(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsItemController_deleteItem, request, response });
            const controller = new ItemController_1.ItemController();
            await templateService.apiHandler({
                methodName: 'deleteItem',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 204,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsHealthController_healthCheck = {};
    app.get('/health', ...((0, runtime_1.fetchMiddlewares)(HealthController_1.HealthController)), ...((0, runtime_1.fetchMiddlewares)(HealthController_1.HealthController.prototype.healthCheck)), async function HealthController_healthCheck(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_healthCheck, request, response });
            const controller = new HealthController_1.HealthController();
            await templateService.apiHandler({
                methodName: 'healthCheck',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsGroupController_getAllGroups = {};
    app.get('/groups', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController)), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController.prototype.getAllGroups)), async function GroupController_getAllGroups(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_getAllGroups, request, response });
            const controller = new GroupController_1.GroupController();
            await templateService.apiHandler({
                methodName: 'getAllGroups',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsGroupController_getGroup = {
        groupId: { "in": "path", "name": "groupId", "required": true, "dataType": "string" },
    };
    app.get('/groups/:groupId', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController)), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController.prototype.getGroup)), async function GroupController_getGroup(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_getGroup, request, response });
            const controller = new GroupController_1.GroupController();
            await templateService.apiHandler({
                methodName: 'getGroup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsGroupController_createGroup = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "CreateGroupDto" },
    };
    app.post('/groups', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController)), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController.prototype.createGroup)), async function GroupController_createGroup(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_createGroup, request, response });
            const controller = new GroupController_1.GroupController();
            await templateService.apiHandler({
                methodName: 'createGroup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsGroupController_updateGroup = {
        groupId: { "in": "path", "name": "groupId", "required": true, "dataType": "string" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "UpdateGroupDto" },
    };
    app.put('/groups/:groupId', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController)), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController.prototype.updateGroup)), async function GroupController_updateGroup(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_updateGroup, request, response });
            const controller = new GroupController_1.GroupController();
            await templateService.apiHandler({
                methodName: 'updateGroup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsGroupController_deleteGroup = {
        groupId: { "in": "path", "name": "groupId", "required": true, "dataType": "string" },
    };
    app.delete('/groups/:groupId', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController)), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController.prototype.deleteGroup)), async function GroupController_deleteGroup(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_deleteGroup, request, response });
            const controller = new GroupController_1.GroupController();
            await templateService.apiHandler({
                methodName: 'deleteGroup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 204,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsGroupController_addUserToGroup = {
        groupId: { "in": "path", "name": "groupId", "required": true, "dataType": "string" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "AddUserToGroupDto" },
    };
    app.post('/groups/:groupId/users', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController)), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController.prototype.addUserToGroup)), async function GroupController_addUserToGroup(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_addUserToGroup, request, response });
            const controller = new GroupController_1.GroupController();
            await templateService.apiHandler({
                methodName: 'addUserToGroup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsGroupController_removeUserFromGroup = {
        groupId: { "in": "path", "name": "groupId", "required": true, "dataType": "string" },
        userId: { "in": "path", "name": "userId", "required": true, "dataType": "string" },
    };
    app.delete('/groups/:groupId/users/:userId', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController)), ...((0, runtime_1.fetchMiddlewares)(GroupController_1.GroupController.prototype.removeUserFromGroup)), async function GroupController_removeUserFromGroup(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsGroupController_removeUserFromGroup, request, response });
            const controller = new GroupController_1.GroupController();
            await templateService.apiHandler({
                methodName: 'removeUserFromGroup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 204,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_register = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "CreateUserDto" },
    };
    app.post('/auth/register', ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.register)), async function AuthController_register(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_register, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'register',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_login = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "LoginDto" },
    };
    app.post('/auth/login', ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.login)), async function AuthController_login(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_login, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_resetAccessCode = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
    };
    app.post('/auth/reset-code', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.resetAccessCode)), async function AuthController_resetAccessCode(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_resetAccessCode, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'resetAccessCode',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_registerGuest = {};
    app.post('/auth/register-guest', ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.registerGuest)), async function AuthController_registerGuest(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_registerGuest, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'registerGuest',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    const argsAuthController_upgradeGuest = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "UpgradeGuestDto" },
    };
    app.post('/auth/upgrade-guest', authenticateMiddleware([{ "jwt": [] }]), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController)), ...((0, runtime_1.fetchMiddlewares)(AuthController_1.AuthController.prototype.upgradeGuest)), async function AuthController_upgradeGuest(request, response, next) {
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        let validatedArgs = [];
        try {
            validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_upgradeGuest, request, response });
            const controller = new AuthController_1.AuthController();
            await templateService.apiHandler({
                methodName: 'upgradeGuest',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
            });
        }
        catch (err) {
            return next(err);
        }
    });
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    function authenticateMiddleware(security = []) {
        return async function runAuthenticationMiddleware(request, response, next) {
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts = [];
            const pushAndRethrow = (error) => {
                failedAttempts.push(error);
                throw error;
            };
            const secMethodOrPromises = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises = [];
                    for (const name in secMethod) {
                        secMethodAndPromises.push(expressAuthenticationRecasted(request, name, secMethod[name], response)
                            .catch(pushAndRethrow));
                    }
                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                }
                else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(expressAuthenticationRecasted(request, name, secMethod[name], response)
                            .catch(pushAndRethrow));
                    }
                }
            }
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
            try {
                request['user'] = await Promise.any(secMethodOrPromises);
                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next();
            }
            catch (err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;
                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }
            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        };
    }
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
//# sourceMappingURL=routes.js.map