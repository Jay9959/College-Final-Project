import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light' | 'midnight' | 'forest';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    currentTheme = signal<Theme>('dark');

    constructor() {
        // Load from local storage or default to dark
        const savedTheme = localStorage.getItem('app-theme') as Theme;
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            this.setTheme('dark');
        }
    }

    setTheme(theme: Theme) {
        this.currentTheme.set(theme);
        localStorage.setItem('app-theme', theme);

        // Remove old theme classes
        document.body.classList.remove('theme-dark', 'theme-light', 'theme-midnight', 'theme-forest');

        // Add new theme class
        document.body.classList.add(`theme-${theme}`);
    }

    getTheme() {
        return this.currentTheme();
    }
}
