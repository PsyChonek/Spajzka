"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const tsoa_1 = require("tsoa");
const authService_1 = __importDefault(require("../services/authService"));
let AuthController = class AuthController extends tsoa_1.Controller {
    authService = new authService_1.default();
    /**
     * Register a new user with username only. Returns a unique access code (UUID) for login.
     */
    async register(requestBody) {
        this.setStatus(201);
        return this.authService.register(requestBody);
    }
    /**
     * Login using access code. Returns JWT token and user info.
     */
    async login(requestBody) {
        return this.authService.login(requestBody);
    }
    /**
     * Reset access code. Generates a new UUID and invalidates the old one (logs out all devices).
     * Requires authentication.
     */
    async resetAccessCode(request) {
        // Extract user ID from JWT token (set by AuthMiddleware)
        const userId = request.user?.id;
        if (!userId) {
            throw new Error("User ID not found in token");
        }
        return this.authService.resetAccessCode(userId);
    }
    /**
     * Register a new guest user with auto-generated username. Automatically logs in and returns JWT token.
     */
    async registerGuest() {
        this.setStatus(201);
        return this.authService.registerGuest();
    }
    /**
     * Upgrade guest account to permanent account with a custom username.
     * Requires authentication.
     */
    async upgradeGuest(request, requestBody) {
        const userId = request.user?.id;
        if (!userId) {
            throw new Error("User ID not found in token");
        }
        return this.authService.upgradeGuest(userId, requestBody);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, tsoa_1.Post)("register"),
    (0, tsoa_1.SuccessResponse)(201, "User registered successfully"),
    (0, tsoa_1.Response)(400, "Validation error"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, tsoa_1.Post)("login"),
    (0, tsoa_1.Response)(401, "Invalid access code"),
    __param(0, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, tsoa_1.Post)("reset-code"),
    (0, tsoa_1.Security)("jwt"),
    (0, tsoa_1.SuccessResponse)(200, "Access code reset successfully"),
    (0, tsoa_1.Response)(401, "Unauthorized"),
    (0, tsoa_1.Response)(404, "User not found"),
    __param(0, (0, tsoa_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetAccessCode", null);
__decorate([
    (0, tsoa_1.Post)("register-guest"),
    (0, tsoa_1.SuccessResponse)(201, "Guest user created and logged in"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerGuest", null);
__decorate([
    (0, tsoa_1.Post)("upgrade-guest"),
    (0, tsoa_1.Security)("jwt"),
    (0, tsoa_1.SuccessResponse)(200, "Guest account upgraded successfully"),
    (0, tsoa_1.Response)(400, "Username already taken or invalid"),
    (0, tsoa_1.Response)(401, "Unauthorized"),
    __param(0, (0, tsoa_1.Request)()),
    __param(1, (0, tsoa_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "upgradeGuest", null);
exports.AuthController = AuthController = __decorate([
    (0, tsoa_1.Route)("auth"),
    (0, tsoa_1.Tags)("Authentication")
], AuthController);
//# sourceMappingURL=AuthController.js.map