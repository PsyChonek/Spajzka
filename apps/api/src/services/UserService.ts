import { UserDto, CreateUserDto } from "../types/dto";

class UserService {

    getUser(_userId: string): Promise<UserDto> {
        throw new Error("Method not implemented.");
    }

    createUser(_requestBody: CreateUserDto): Promise<UserDto> {
        throw new Error("Method not implemented.");
    }
}

export default UserService;
