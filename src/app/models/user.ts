export interface User {
    id: string;
    email: string;
    userName?: string;
    role?: Role;
}

export interface UserUpdateModel {
    email: string;
    userName?: string;
    role: string;
}

export interface Role {
    id: string;
    role: string;
}