// src/middleware/AuthMiddleware.ts
import { Request } from "express";
import * as jwt from "jsonwebtoken";
import config from "../config/config";

export function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === "jwt") {
    const token = request.headers["authorization"]?.split(" ")[1];

    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new Error("No token provided"));
      }

      jwt.verify(token as string, config.jwtSecret, (err: any, decoded: any) => {
        if (err) {
          reject(err);
        } else {
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
