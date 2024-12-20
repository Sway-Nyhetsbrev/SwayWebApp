export interface User {
    id: string;
    email: string;
    userName?: string;
    role?: Role;
}

export interface Role {
    id: string;
    role: string;
}