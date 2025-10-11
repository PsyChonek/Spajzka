"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressAuthentication = expressAuthentication;
const jwt = __importStar(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config/config"));
function expressAuthentication(request, securityName, scopes) {
    if (securityName === "jwt") {
        const token = request.headers["authorization"]?.split(" ")[1];
        return new Promise((resolve, reject) => {
            if (!token) {
                reject(new Error("No token provided"));
            }
            jwt.verify(token, config_1.default.jwtSecret, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                else {
                    // Attach user info to request for use in controllers
                    request.user = decoded;
                    // Check if scopes are required and included in the token
                    if (scopes && scopes.length > 0) {
                        // Add scope checking logic here if needed
                        // For example: if (!decoded.scopes || !scopes.every(scope => decoded.scopes.includes(scope))) {
                        //   reject(new Error("JWT does not contain required scope"));
                        // }
                    }
                    resolve(decoded);
                }
            });
        });
    }
    return Promise.reject(new Error("Invalid security name"));
}
//# sourceMappingURL=AuthMiddleware.js.map