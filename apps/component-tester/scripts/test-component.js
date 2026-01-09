#!/usr/bin/env node

/**
 * UIForge Component Tester
 *
 * Script to install and test generated npm components
 * Usage: npm run test-component <package-name>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageName = process.argv[2];

if (!packageName) {
  console.error('❌ Error: Please provide a package name');
  console.log('Usage: npm run test-component <package-name>');
  console.log('Example: npm run test-component @uiforge/button-primary');
  process.exit(1);
}

console.log(`\n🔧 Installing component: ${packageName}\n`);

try {
  // Install the package
  console.log('📦 Installing package...');
  execSync(`npm install ${packageName}`, { stdio: 'inherit' });

  console.log(`\n✅ Successfully installed ${packageName}`);
  console.log('\n📝 Next steps:');
  console.log(`   1. Import the component in your page`);
  console.log(`   2. Use it in your JSX`);
  console.log(`   3. Run "npm run dev" to test`);
  console.log(`   4. View at http://localhost:3005\n`);

} catch (error) {
  console.error(`\n❌ Failed to install ${packageName}`);
  console.error(error.message);
  process.exit(1);
}
