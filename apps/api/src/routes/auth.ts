import { LoginUserInput, LoginUserOutput, LogoutUserInput, LogoutUserOutput, RefreshTokenInput, RefreshTokenOutput } from "src/models/api/auth";
import { validateUser, generateJWT, generateRefreshToken, invalidateToken, refreshJWT } from "../services/authService";

export const authRoutes = (server: any) => {
	// Login
	server.route({
		method: "POST",
		url: "/auth/login",
		schema: {
			tags: ["Authentication"],
			summary: "Login user",
			body: {
				$ref: "LoginUserInput", // Schema for login input
			},
			response: {
				200: {
					$ref: "LoginUserOutput", // Schema for login output
				},
			},
		},
		handler: async (req: { body: LoginUserInput }, reply: any) => {
			try {
				const { email, password } = req.body;

				// Validate user credentials (replace with your logic)
				const user = await validateUser(email, password);
				if (!user) {
					return reply.status(401).send({ error: "Invalid email or password" });
				}

				// Generate JWT and refresh token
				const jwtToken = generateJWT(user.id);
				const refreshToken = generateRefreshToken(user.id);

				const response: LoginUserOutput = {
					id: user.id,
					jwt: jwtToken,
					refreshToken,
				};

				reply.send(response);
			} catch (error) {
				reply.status(500).send({ error: "Internal Server Error" });
			}
		},
	});

	// Logout
	server.route({
		method: "POST",
		url: "/auth/logout",
		schema: {
			tags: ["Authentication"],
			summary: "Logout user",
			body: {
				$ref: "LogoutUserInput", // Schema for logout input
			},
			response: {
				200: {
					$ref: "LogoutUserOutput", // Schema for logout output
				},
			},
		},
		handler: async (req: { body: LogoutUserInput }, reply: any) => {
			try {
				const { token } = req.body;

				// Invalidate the token (e.g., add it to a blacklist)
				await invalidateToken(token);

				const response: LogoutUserOutput = {
					message: "Successfully logged out",
				};

				reply.send(response);
			} catch (error) {
				reply.status(500).send({ error: "Internal Server Error" });
			}
		},
	});

	// Refresh Token
	server.route({
		method: "POST",
		url: "/auth/refresh",
		schema: {
			tags: ["Authentication"],
			summary: "Refresh JWT token",
			body: {
				$ref: "RefreshTokenInput", // Schema for refresh token input
			},
			response: {
				200: {
					$ref: "RefreshTokenOutput", // Schema for refresh token output
				},
			},
		},
		handler: async (req: { body: RefreshTokenInput }, reply: any) => {
			try {
				const { refreshToken } = req.body;

				// Validate and refresh the token
				const newToken = await refreshJWT(refreshToken);
				if (!newToken) {
					return reply.status(401).send({ error: "Invalid or expired refresh token" });
				}

				const response: RefreshTokenOutput = {
					jwt: newToken,
				};

				reply.send(response);
			} catch (error) {
				reply.status(500).send({ error: "Internal Server Error" });
			}
		},
	});
};
