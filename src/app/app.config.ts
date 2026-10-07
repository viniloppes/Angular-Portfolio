import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

import { routes } from './app.routes';

// Âmbar AmberLink (mesma escala das variáveis do Figma)
const portfolioTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fff6ec',
      100: '#ffe8cc',
      200: '#ffd199',
      300: '#ffb866',
      400: '#ff9f33',
      500: '#f58a07',
      600: '#d96f00',
      700: '#a85200',
      800: '#7a3a00',
      900: '#4a2300',
      950: '#2e1600',
    },
    colorScheme: {
      light: {
        // Neutros quentes (papel/tinta) no lugar do slate padrão do Aura
        surface: {
          0: '#ffffff',
          50: '#fbf7f2',
          100: '#f5ede4',
          200: '#eadfd3',
          300: '#d9c9b8',
          400: '#b5a493',
          500: '#8f7f70',
          600: '#6e6259',
          700: '#524840',
          800: '#3a322c',
          900: '#2a231e',
          950: '#1f1712',
        },
        // Texto em tinta escura: branco sobre âmbar 500 não passa contraste AA
        primary: {
          color: '{primary.500}',
          contrastColor: '#1f1712',
          hoverColor: '{primary.400}',
          activeColor: '{primary.600}',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    providePrimeNG({
      theme: {
        preset: portfolioTheme,
        options: {
          darkModeSelector: false,
          cssLayer: { name: 'primeng', order: 'theme, base, primeng, components, utilities' },
        },
      },
    }),
  ],
};
