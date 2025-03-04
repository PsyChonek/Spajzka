import { UserDto, CreateUserDto } from "../types/dto";

class UserService {

    getUser(userId: string): Promise<UserDto> {
        throw new Error("Method not implemented.");
    }

    createUser(requestBody: CreateUserDto): Promise<UserDto> {
        throw new Error("Method not implemented.");
    }
}

export default UserService;
