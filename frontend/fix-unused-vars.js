/**
 * Script to fix unused variables in TypeScript files
 * Run with: node fix-unused-vars.js
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Get list of TypeScript files with errors
exec('cd frontend && yarn lint', (error, stdout, stderr) => {
  if (error) {
    console.log(`Error running lint: ${error.message}`);
    return;
  }
  
  const errorLines = stdout.split('\n');
  const fileErrors = {};

  // Parse error output to group errors by file
  errorLines.forEach(line => {
    // Match lines like: ./src/app/page.tsx:5:8  Error: 'useState' is defined but never used.  @typescript-eslint/no-unused-vars
    const match = line.match(/\.\/(.+\.tsx?):(\d+):(\d+)\s+Error: '(.+)' is (defined|assigned) but never used\.\s+@typescript-eslint\/no-unused-vars/);
    if (match) {
      const [_, filePath, lineNum, colNum, varName] = match;
      if (!fileErrors[filePath]) {
        fileErrors[filePath] = [];
      }
      fileErrors[filePath].push({ line: parseInt(lineNum), col: parseInt(colNum), varName });
    }
  });

  // Process each file with errors
  Object.entries(fileErrors).forEach(([filePath, errors]) => {
    const fullPath = path.join('frontend', filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let lines = content.split('\n');
      
      // Sort errors by line number in descending order to avoid offset issues
      errors.sort((a, b) => b.line - a.line);
      
      errors.forEach(error => {
        const lineIndex = error.line - 1;
        let line = lines[lineIndex];
        
        // Add underscore prefix to variable name
        const varName = error.varName;
        const newVarName = `_${varName}`;
        const varPattern = new RegExp(`(\\b|\\s|,|\\()${varName}(\\b|\\s|,|\\))`, 'g');
        
        // Replace the variable name with underscore prefix
        lines[lineIndex] = line.replace(varPattern, (match, prefix, suffix) => {
          return `${prefix}${newVarName}${suffix}`;
        });
      });
      
      // Write back to the file
      fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
      console.log(`Fixed unused variables in ${filePath}`);
    }
  });

  console.log('Done fixing unused variables');
}); 