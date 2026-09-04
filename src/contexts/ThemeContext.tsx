import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    // Lấy theme đã lưu trong localstorage(nếu có), default: light
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('app-theme') as Theme;
        return savedTheme || 'light';
    });

    useEffect(() => {
        const root = document.documentElement;

        // Xóa các theme cũ trên html
        root.classList.remove('light', 'dark');

        // Thêm class thêm mới vào html
        root.classList.add(theme);

        // Lưu vào localstorage
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = (newTheme: Theme) => {
        setTheme(newTheme);
    }

    return (
        <ThemeContext.Provider value={{theme, toggleTheme}}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if(!context) {
        throw new Error("useTheme phải được sử dụng bên trong ThemeProvider")
    }
    return context;
}