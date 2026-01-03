/**
 * Maestro installation helper
 * Installs Maestro CLI if not already installed
 */

import { execSync, spawnSync } from 'child_process';
import pc from 'picocolors';
import ora from 'ora';

export function isMaestroInstalled(): boolean {
  try {
    execSync('maestro --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function getMaestroVersion(): string | null {
  try {
    const output = execSync('maestro --version', { encoding: 'utf-8', stdio: 'pipe' });
    return output.trim();
  } catch {
    return null;
  }
}

export async function installMaestro(): Promise<boolean> {
  const spinner = ora('Installing Maestro...').start();

  try {
    // Detect platform
    const platform = process.platform;

    if (platform === 'darwin' || platform === 'linux') {
      // macOS and Linux: Use the official install script
      spinner.text = 'Downloading Maestro installer...';

      const result = spawnSync('sh', ['-c', 'curl -Ls "https://get.maestro.mobile.dev" | bash'], {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 120000,
      });

      if (result.status !== 0) {
        const error = result.stderr || result.stdout || 'Unknown error';
        throw new Error(`Installation failed: ${error}`);
      }

      // Verify installation
      spinner.text = 'Verifying installation...';

      // The installer adds maestro to ~/.maestro/bin
      // We need to check if it's in PATH or add it
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      const maestroBin = `${homeDir}/.maestro/bin/maestro`;

      try {
        execSync(`"${maestroBin}" --version`, { stdio: 'pipe' });
        spinner.succeed('Maestro installed successfully');

        console.log(pc.yellow('\n⚠️  Note: Add Maestro to your PATH:'));
        console.log(pc.dim(`    export PATH="$PATH:${homeDir}/.maestro/bin"`));
        console.log(pc.dim('    Add this to your ~/.bashrc or ~/.zshrc\n'));

        return true;
      } catch {
        // Try system PATH
        execSync('maestro --version', { stdio: 'pipe' });
        spinner.succeed('Maestro installed successfully');
        return true;
      }
    } else if (platform === 'win32') {
      spinner.fail('Windows installation not supported via script');
      console.log(pc.yellow('\nPlease install Maestro manually:'));
      console.log(pc.dim('  1. Download from: https://maestro.mobile.dev/getting-started/installing-maestro'));
      console.log(pc.dim('  2. Or use WSL and run: curl -Ls "https://get.maestro.mobile.dev" | bash\n'));
      return false;
    } else {
      spinner.fail(`Unsupported platform: ${platform}`);
      return false;
    }
  } catch (error) {
    const err = error as Error;
    spinner.fail(`Failed to install Maestro: ${err.message}`);
    console.log(pc.yellow('\nManual installation:'));
    console.log(pc.dim('  curl -Ls "https://get.maestro.mobile.dev" | bash'));
    console.log(pc.dim('  See: https://maestro.mobile.dev/getting-started/installing-maestro\n'));
    return false;
  }
}

export async function ensureMaestroInstalled(): Promise<boolean> {
  if (isMaestroInstalled()) {
    const version = getMaestroVersion();
    console.log(pc.green(`✓ Maestro is installed: ${version}`));
    return true;
  }

  console.log(pc.yellow('Maestro is not installed.'));
  console.log(pc.dim('Installing Maestro CLI...\n'));

  return await installMaestro();
}

export function isMaestroIosDeviceInstalled(): boolean {
  try {
    execSync('maestro-ios-device --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function getMaestroIosDeviceVersion(): string | null {
  try {
    const output = execSync('maestro-ios-device --version', { encoding: 'utf-8', stdio: 'pipe' });
    return output.trim();
  } catch {
    return null;
  }
}

export async function installMaestroIosDevice(): Promise<boolean> {
  const spinner = ora('Installing maestro-ios-device...').start();

  try {
    const platform = process.platform;

    if (platform !== 'darwin') {
      spinner.fail('maestro-ios-device requires macOS');
      console.log(pc.yellow('\nmaestro-ios-device only works on macOS with Xcode.\n'));
      return false;
    }

    spinner.text = 'Downloading maestro-ios-device installer...';

    const result = spawnSync(
      'sh',
      ['-c', 'curl -fsSL https://raw.githubusercontent.com/devicelab-dev/maestro-ios-device/main/setup.sh | bash'],
      {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: 300000,
      }
    );

    if (result.status !== 0) {
      const error = result.stderr || result.stdout || 'Unknown error';
      throw new Error(`Installation failed: ${error}`);
    }

    spinner.text = 'Verifying installation...';

    if (isMaestroIosDeviceInstalled()) {
      spinner.succeed('maestro-ios-device installed successfully');

      console.log(pc.cyan('\n📱 Physical iOS Device Setup:\n'));
      console.log(pc.dim('  1. Connect your iOS device via USB'));
      console.log(pc.dim('  2. Trust the computer on your device'));
      console.log(pc.dim('  3. Enable Developer Mode (iOS 16+): Settings → Privacy & Security → Developer Mode'));
      console.log(pc.dim('  4. Enable UI Automation: Settings → Developer → Enable UI Automation'));
      console.log(pc.dim('\n  Find your device UDID:'));
      console.log(pc.dim('    xcrun xctrace list devices'));
      console.log(pc.dim('\n  Find your Team ID:'));
      console.log(pc.dim('    security find-identity -v -p codesigning | grep "Developer"'));
      console.log(pc.dim('\n  Start the bridge (in a separate terminal):'));
      console.log(pc.dim('    maestro-ios-device --team-id YOUR_TEAM_ID --device DEVICE_UDID'));
      console.log(pc.dim('\n  Then run mobile-use:'));
      console.log(pc.dim('    mobile-use <bundleId> <task> --ios-device UDID --team-id TEAM_ID --app-file /path/to/app.ipa\n'));

      return true;
    } else {
      spinner.fail('Installation completed but verification failed');
      return false;
    }
  } catch (error) {
    const err = error as Error;
    spinner.fail(`Failed to install maestro-ios-device: ${err.message}`);
    console.log(pc.yellow('\nManual installation:'));
    console.log(pc.dim('  curl -fsSL https://raw.githubusercontent.com/devicelab-dev/maestro-ios-device/main/setup.sh | bash'));
    console.log(pc.dim('  See: https://github.com/devicelab-dev/maestro-ios-device\n'));
    return false;
  }
}

export async function ensureMaestroIosDeviceInstalled(): Promise<boolean> {
  if (isMaestroIosDeviceInstalled()) {
    const version = getMaestroIosDeviceVersion();
    console.log(pc.green(`✓ maestro-ios-device is installed: ${version}`));
    return true;
  }

  console.log(pc.yellow('maestro-ios-device is not installed.'));
  console.log(pc.dim('Installing maestro-ios-device...\n'));

  return await installMaestroIosDevice();
}

// Run directly if called as script
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureMaestroInstalled()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
