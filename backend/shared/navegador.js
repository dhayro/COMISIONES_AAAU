const fs = require('fs');
const path = require('path');

const RUTAS_CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const rutaChromeInstalado = () => RUTAS_CHROME.find((ruta) => fs.existsSync(ruta));

const lanzarNavegador = (puppeteer) =>
  puppeteer.launch({
    headless: true,
    executablePath: rutaChromeInstalado(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

module.exports = { lanzarNavegador };
