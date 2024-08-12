// User.repository.interface.ts
import { TUser } from '../model';

export interface IUserRepository {
    createUser(user: TUser): Promise<TUser>;
    getUserById(id: string): Promise<TUser | null>;
    updateUser(id: string, user: Partial<TUser>): Promise<TUser | null>;
    deleteUser(id: string): Promise<void>;
}
