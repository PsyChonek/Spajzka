import {
  Controller,
  Post,
  Body,
  Route,
  SuccessResponse,
  Response,
  Tags,
  Security,
  Request,
} from "tsoa";
import type { UserDto, CreateUserDto, LoginDto, TokenResponseDto, ResetAccessCodeResponseDto, UpgradeGuestDto } from "../types/dto";
import AuthService from "../services/authService";
import type { Request as ExpressRequest } from "express";

@Route("auth")
@Tags("Authentication")
export class AuthController extends Controller {
  private authService = new AuthService();

  /**
   * Register a new user with username only. Returns a unique access code (UUID) for login.
   */
  @Post("register")
  @SuccessResponse(201, "User registered successfully")
  @Response(400, "Validation error")
  public async register(@Body() requestBody: CreateUserDto): Promise<UserDto> {
    this.setStatus(201);
    return this.authService.register(requestBody);
  }

  /**
   * Login using access code. Returns JWT token and user info.
   */
  @Post("login")
  @Response(401, "Invalid access code")
  public async login(@Body() requestBody: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(requestBody);
  }

  /**
   * Reset access code. Generates a new UUID and invalidates the old one (logs out all devices).
   * Requires authentication.
   */
  @Post("reset-code")
  @Security("jwt")
  @SuccessResponse(200, "Access code reset successfully")
  @Response(401, "Unauthorized")
  @Response(404, "User not found")
  public async resetAccessCode(@Request() request: ExpressRequest): Promise<ResetAccessCodeResponseDto> {
    // Extract user ID from JWT token (set by AuthMiddleware)
    const userId = (request as any).user?.id;
    if (!userId) {
      throw new Error("User ID not found in token");
    }
    return this.authService.resetAccessCode(userId);
  }

  /**
   * Register a new guest user with auto-generated username. Automatically logs in and returns JWT token.
   */
  @Post("register-guest")
  @SuccessResponse(201, "Guest user created and logged in")
  public async registerGuest(): Promise<TokenResponseDto> {
    this.setStatus(201);
    return this.authService.registerGuest();
  }
  /**
   * Upgrade guest account to permanent account with a custom username.
   * Requires authentication.
   */
  @Post("upgrade-guest")
  @Security("jwt")
  @SuccessResponse(200, "Guest account upgraded successfully")
  @Response(400, "Username already taken or invalid")
  @Response(401, "Unauthorized")
  public async upgradeGuest(
    @Request() request: ExpressRequest,
    @Body() requestBody: UpgradeGuestDto
  ): Promise<UserDto> {
    const userId = (request as any).user?.id;
    if (!userId) {
      throw new Error("User ID not found in token");
    }
    return this.authService.upgradeGuest(userId, requestBody);
  }
}
