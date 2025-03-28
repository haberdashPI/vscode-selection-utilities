import { defineConfig } from 'vitepress'
import { commands } from './commands.mjs';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/vscode-selection-utilities/',
  title: "Selection Utilities",
  description: "Kakaune-inspired collection of useful commands for manipulating selections.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
      { text: 'Home', link: '/' },
      ...commands
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/haberdashpi/vscode-selection-utilities' }
    ]
  }
})
