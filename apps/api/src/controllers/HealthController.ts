import { Controller, Get, Route, Tags } from "tsoa";

@Route("health") // This sets the base route to "/health"
@Tags("Health") // This sets the tag for the controller
export class HealthController extends Controller {
  /**
   * Health check endpoint
   * @returns A simple status message
   */
  @Get("/")
  public async healthCheck(): Promise<{ status: string }> {
    return { status: "OK" };
  }
}
