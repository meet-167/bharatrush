import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.resolve();

const distDir = path.join(__dirname, 'dist');
const assetsDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'assets', 'www');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  execSync(`${npmCmd} run build`, { stdio: 'inherit' });

  console.log('Cleaning assets directory...');
  if (fs.existsSync(assetsDir)) {
    fs.rmSync(assetsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(assetsDir, { recursive: true });

  console.log('Copying build files to Android assets...');
  copyRecursiveSync(distDir, assetsDir);

  console.log('Web assets successfully packaged into Android assets!');
} catch (error) {
  console.error('Error during packaging:', error);
  process.exit(1);
}
