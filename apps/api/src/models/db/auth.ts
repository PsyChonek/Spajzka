import { ObjectId } from "mongodb";

/**
 * Represents a refresh token stored in the database.
 */
export interface RefreshToken {
	id: ObjectId; // Unique identifier for the refresh token
	userId: ObjectId; // The ID of the user associated with this token
	token: string; // The refresh token string
	jwt: string; // The JWT token associated with this refresh token
	expiresAt: Date; // Expiration date of the refresh token
	createdAt: Date; // Timestamp when the token was created
	revokedAt?: Date | null; // Optional: Timestamp for when the token was revoked
}

/**
 * Represents the payload of a JWT token.
 */
export interface JWTPayload {
	id: string; // User ID (as a string, since JWTs typically store IDs as strings)
	iat: number; // Issued at timestamp
	exp: number; // Expiration timestamp
}
