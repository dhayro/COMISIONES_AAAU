const fs = require('fs');
const path = require('path');

// Remove source map files from stylis-plugin-rtl
const stylispath = path.join(__dirname, '../node_modules/stylis-plugin-rtl');

if (fs.existsSync(stylispath)) {
  // Remove .map files
  const removeMapFiles = (dir) => {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          removeMapFiles(filePath);
        } else if (file.endsWith('.map')) {
          fs.unlinkSync(filePath);
          console.log(`Removed: ${filePath}`);
        } else if (file.endsWith('.js')) {
          // Remove sourceMappingURL comments from JS files
          let content = fs.readFileSync(filePath, 'utf8');
          const modified = content.replace(/\/\/# sourceMappingURL=[^\n]*\n?/g, '');
          if (content !== modified) {
            fs.writeFileSync(filePath, modified);
            console.log(`Removed sourcemap reference from: ${filePath}`);
          }
        }
      });
    }
  };

  removeMapFiles(stylispath);
  console.log('Fixed stylis-plugin-rtl source map issues');
}
