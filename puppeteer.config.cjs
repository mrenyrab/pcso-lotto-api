const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // This forces Puppeteer to install Chrome inside your project folder
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
