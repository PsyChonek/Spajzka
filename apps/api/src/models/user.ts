import { ItemUser } from "./itemUser";

export interface User {
    id: string | undefined | null;
    name: string;
    password: string;
    email: string;
    /**
 * @ref ItemUser
 */
    items: ItemUser[];
}