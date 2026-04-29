import type { ForgeConfig } from '@electron-forge/shared-types';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import fs from 'fs';
import path from 'path';

const APP_NAME = '墨帖 InkPost';

// Fix macOS menu bar name by patching Electron.app's Info.plist in dev mode
function patchElectronAppName(): void {
  if (process.platform !== 'darwin') return;
  try {
    const plistPath = path.resolve(__dirname, 'node_modules/electron/dist/Electron.app/Contents/Info.plist');
    if (!fs.existsSync(plistPath)) return;

    let plist = fs.readFileSync(plistPath, 'utf-8');
    // Replace CFBundleName and CFBundleDisplayName
    plist = plist.replace(
      /<key>CFBundleName<\/key>\s*<string>[^<]*<\/string>/,
      `<key>CFBundleName</key>\n\t<string>${APP_NAME}</string>`
    );
    plist = plist.replace(
      /<key>CFBundleDisplayName<\/key>\s*<string>[^<]*<\/string>/,
      `<key>CFBundleDisplayName</key>\n\t<string>${APP_NAME}</string>`
    );
    fs.writeFileSync(plistPath, plist, 'utf-8');
  } catch {
    // Silently skip if patching fails (e.g. packaged environment)
  }
}

const config: ForgeConfig = {
  packagerConfig: {
    icon: './assets/icon',
    appBundleId: 'com.inkpost.app',
    appCategoryType: 'public.app-category.productivity',
    extendInfo: {
      CFBundleName: APP_NAME,
      CFBundleDisplayName: APP_NAME,
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: { name: 'InkPost' },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: { name: APP_NAME },
    },
    {
      name: '@electron-forge/maker-zip',
      config: {},
      platforms: ['darwin', 'win32'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
  ],
  hooks: {
    generateAssets: async () => {
      patchElectronAppName();
    },
  },
  plugins: [
    new WebpackPlugin({
      port: 9001,
      devContentSecurityPolicy: "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; img-src * data: blob:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' ws://localhost:* http://localhost:* https: http:; font-src 'self' https:;",
      mainConfig: './webpack.main.config.ts',
      renderer: {
        config: './webpack.renderer.config.ts',
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer/renderer.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload/preload.ts',
            },
          },
        ],
      },
    }),
  ],
};

export default config;
