import type { ChangeEvent } from "react";

export interface InputFieldProps {
    label: string;
    type?: 'text' | 'email' | "password";
    placeholder?: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    isPassword?: boolean;
}