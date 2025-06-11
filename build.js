
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building application...');

try {
  // Run the build command
  execSync('npm run build', { stdio: 'inherit' });
  
  // Check if build output exists
  const distPath = path.join(process.cwd(), 'dist', 'public');
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build failed: dist/public directory not created');
    process.exit(1);
  }
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ Build failed: index.html not created');
    process.exit(1);
  }
  
  console.log('✅ Build completed successfully');
  console.log(`📁 Static files in: ${distPath}`);
  console.log(`📄 Files created:`, fs.readdirSync(distPath));
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
