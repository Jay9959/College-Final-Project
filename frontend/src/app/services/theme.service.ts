import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light' | 'system' | 'midnight' | 'forest';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    currentTheme = signal<Theme>('system');
    private mediaQuery: MediaQueryList;

    constructor() {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Load from local storage or default to system
        const savedTheme = localStorage.getItem('app-theme') as Theme;
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            this.setTheme('system');
        }

        // Listen for system changes
        this.mediaQuery.addEventListener('change', (e) => {
            if (this.currentTheme() === 'system') {
                this.applyThemeClass(e.matches ? 'dark' : 'light');
            }
        });
    }

    setTheme(theme: Theme) {
        this.currentTheme.set(theme);
        localStorage.setItem('app-theme', theme);

        if (theme === 'system') {
            const systemDark = this.mediaQuery.matches;
            this.applyThemeClass(systemDark ? 'dark' : 'light');
        } else {
            this.applyThemeClass(theme);
        }
    }

    private applyThemeClass(theme: string) {
        // Remove old theme classes
        document.body.classList.remove('theme-dark', 'theme-light', 'theme-midnight', 'theme-forest');

        // Add new theme class
        document.body.classList.add(`theme-${theme}`);
    }

    getTheme() {
        return this.currentTheme();
    }
}
