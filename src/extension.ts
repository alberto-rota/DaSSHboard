/**
 * Generates default settings for all hosts (SSH, WSL, and Docker).
 * This ensures that all hosts are pre-populated in the settings.
 * Called on extension activation and when dashboard is opened.
 */
async function generateDefaultHostSettings(): Promise<void> {
  try {
      console.log('DaSSHboard: Checking for new hosts and updating settings...');
      
      // Get all hosts from SSH config and WSL (Docker containers are not saved to settings)
      const allHosts = await getAllHosts();
      const hosts = [...allHosts.ssh, ...allHosts.wsl];
      
      // Get current settings
      const config = vscode.workspace.getConfiguration('daSSHboard');
      let hostsConfig = config.get<Record<string, HostSettings>>('hosts') || {};
      let settingsUpdated = false;
      const newHosts: string[] = [];
      
      // Create default settings for each host if not already present
      for (const host of hosts) {
          if (!hostsConfig[host.name]) {
              // Default folder based on type and user
              let defaultFolder = '/home';
              
              if (host.type === 'ssh') {
                  defaultFolder = host.user ? `/home/${host.user}` : '/home';
              } else if (host.type === 'wsl') {
                  // For WSL, default to home directory
                  defaultFolder = '/home';
              } else if (host.type === 'docker') {
                  // For Docker, default to common workspace directories
                  defaultFolder = '/workspaces';
              }
              
              hostsConfig[host.name] = {
                  folders: [defaultFolder],
                  color: '',  // Empty but present
                  icon: ''    // Empty but present
              };
              
              newHosts.push(host.name);
              settingsUpdated = true;
          }
      }
      
      // Update the configuration if changes were made
      if (settingsUpdated) {
          await config.update('hosts', hostsConfig, vscode.ConfigurationTarget.Global);
          console.log(`DaSSHboard: Added ${newHosts.length} new host(s) to settings: ${newHosts.join(', ')}`);
      } else {
          console.log('DaSSHboard: No new hosts detected. Settings are up to date.');
      }
  } catch (error) {
      console.error('DaSSHboard: Error generating default host settings:', error);
  }
}
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as dns from 'dns';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Interface for host settings
interface HostSettings {
  folders?: string[];
  color?: string;
  icon?: string;
}

// Interface for host configuration with IP
interface HostConfig {
  name: string;          // The SSH Host name/alias (e.g., "Orion", "ASXCVM") or WSL distro name or container name
  hostname: string;      // The actual hostname/IP (e.g., "34.171.91.187") or WSL distro name or container ID
  user?: string;         // The username for the connection
  ip?: string;           // Resolved IP address (if different from hostname)
  settings: HostSettings;
  type: 'ssh' | 'wsl' | 'docker';   // Type of connection: SSH, WSL, or Docker
  containerId?: string;  // Docker container ID (for docker type)
  containerStatus?: string; // Docker container status (running, paused, etc.)
  imageInfo?: string;    // Docker image information
  distroType?: string;   // WSL distro type (e.g., "Ubuntu", "Debian", etc.)
}

/**
* Helper function to extract the hue value from a color.
* This is used for SVG coloring using CSS filters.
*/
function getHue(color: string): number {
  // Default hue if we can't parse the color
  let hue = 0;
  
  // Handle hex colors
  if (color.startsWith('#')) {
      // Convert hex to RGB
      let r, g, b;
      
      // #RGB or #RGBA format
      if (color.length === 4 || color.length === 5) {
          r = parseInt(color.charAt(1) + color.charAt(1), 16);
          g = parseInt(color.charAt(2) + color.charAt(2), 16);
          b = parseInt(color.charAt(3) + color.charAt(3), 16);
      } 
      // #RRGGBB or #RRGGBBAA format
      else if (color.length === 7 || color.length === 9) {
          r = parseInt(color.substring(1, 3), 16);
          g = parseInt(color.substring(3, 5), 16);
          b = parseInt(color.substring(5, 7), 16);
      }
      else {
          return hue; // Can't parse, return default
      }
      
      // Convert RGB to HSL to get the hue
      r /= 255;
      g /= 255;
      b /= 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      
      // Calculate hue
      if (max === min) {
          hue = 0; // achromatic
      } else {
          const d = max - min;
          if (max === r) {
              hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
          } else if (max === g) {
              hue = ((b - r) / d + 2) * 60;
          } else if (max === b) {
              hue = ((r - g) / d + 4) * 60;
          }
      }
  }
  // Handle rgb/rgba colors
  else if (color.startsWith('rgb')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      if (match) {
          const r = parseInt(match[1]) / 255;
          const g = parseInt(match[2]) / 255;
          const b = parseInt(match[3]) / 255;
          
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          
          // Calculate hue
          if (max === min) {
              hue = 0; // achromatic
          } else {
              const d = max - min;
              if (max === r) {
                  hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
              } else if (max === g) {
                  hue = ((b - r) / d + 2) * 60;
              } else if (max === b) {
                  hue = ((r - g) / d + 4) * 60;
              }
          }
      }
  }
  
  return hue;
}

/**
* Reads the default SSH config file (~/.ssh/config) and extracts host aliases
* and hostname information.
*/
async function getSshHosts(): Promise<HostConfig[]> {
  const configPath = path.join(os.homedir(), '.ssh', 'config');
  if (!fs.existsSync(configPath)) {
      return [];
  }
  
  const content = fs.readFileSync(configPath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  // Parse config to extract Host, HostName, and User
  const hostConfigs: Map<string, HostConfig> = new Map();
  let currentHost: string | null = null;
  
  for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Extract Host entries
      if (trimmedLine.toLowerCase().startsWith("host ")) {
          const parts = trimmedLine.split(/\s+/);
          // Skip the first element which is "Host"
          for (let i = 1; i < parts.length; i++) {
              const alias = parts[i].trim();
              // Skip wildcard entries
              if (alias && alias !== '*') {
                  currentHost = alias;
                  if (!hostConfigs.has(currentHost)) {
                      hostConfigs.set(currentHost, {
                          name: currentHost,
                          hostname: currentHost, // Default to the alias
                          settings: getHostSettings(currentHost),
                          type: 'ssh'
                      });
                  }
              }
          }
      }
      // Extract HostName entries for the current host
      else if (currentHost && trimmedLine.toLowerCase().startsWith("hostname ")) {
          const hostname = trimmedLine.substring(9).trim();
          if (hostname && hostConfigs.has(currentHost)) {
              const config = hostConfigs.get(currentHost)!;
              config.hostname = hostname;
              hostConfigs.set(currentHost, config);
          }
      }
      // Extract User entries for the current host
      else if (currentHost && trimmedLine.toLowerCase().startsWith("user ")) {
          const user = trimmedLine.substring(5).trim();
          if (user && hostConfigs.has(currentHost)) {
              const config = hostConfigs.get(currentHost)!;
              config.user = user;
              hostConfigs.set(currentHost, config);
          }
      }
  }
  
  // Resolve IP addresses for all hosts
  const hostConfigsArray = Array.from(hostConfigs.values());
  
  // Resolve IP addresses (async)
  for (const config of hostConfigsArray) {
      try {
          // Only resolve if hostname is not already an IP address
          if (!/^\d+\.\d+\.\d+\.\d+$/.test(config.hostname)) {
              config.ip = await resolveHostnameToIp(config.hostname);
          }
      } catch (error) {
          // Could not resolve IP
          console.error(`Could not resolve IP for ${config.hostname}: ${error}`);
      }
  }
  
  return hostConfigsArray;
}

/**
* Resolves a hostname to an IP address.
*/
function resolveHostnameToIp(hostname: string): Promise<string> {
  return new Promise((resolve, reject) => {
      dns.lookup(hostname, (err, address) => {
          if (err) {
              reject(err);
              return;
          }
          resolve(address);
      });
  });
}

/**
* Checks if the system is Windows and if WSL is available.
*/
function isWslAvailable(): boolean {
  return os.platform() === 'win32';
}

/**
* Checks if the WSL extension is installed in VSCode/Cursor.
*/
function isWslExtensionInstalled(): boolean {
  // Check for the official VSCode WSL extension
  const msWslExtension = vscode.extensions.getExtension('ms-vscode-remote.remote-wsl');
  // Check for the AnySphere/Cursor WSL extension
  const anysphereWslExtension = vscode.extensions.getExtension('anysphere.remote-wsl');
  
  return msWslExtension !== undefined || anysphereWslExtension !== undefined;
}

/**
* Gets all installed WSL distros on Windows.
* Returns an array of WSL distro configurations.
*/
async function getWslDistros(): Promise<HostConfig[]> {
  // Only proceed if on Windows and WSL extension is installed
  if (!isWslAvailable()) {
      console.log('DaSSHboard: Not on Windows, skipping WSL detection');
      return [];
  }
  
  if (!isWslExtensionInstalled()) {
      console.log('DaSSHboard: WSL extension not found, skipping WSL detection');
      console.log('DaSSHboard: Available extensions:', vscode.extensions.all.map(ext => ext.id).filter(id => id.includes('wsl')));
      return [];
  }

  try {
      console.log('DaSSHboard: Attempting to detect WSL distros...');
      
      // Execute wsl --list --verbose to get all distros
      const { stdout } = await execAsync('wsl --list --verbose', { 
          encoding: 'utf16le',  // WSL outputs in UTF-16LE on Windows
          windowsHide: true 
      });

      console.log('DaSSHboard: WSL command output:', stdout);
      
      const lines = stdout.split(/\r?\n/).filter(line => line.trim());
      const distros: HostConfig[] = [];

      // Skip the header line (NAME STATE VERSION)
      for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) {continue;}

          // Parse the line: format is "* NAME STATE VERSION" or "  NAME STATE VERSION"
          // The * indicates the default distro
          // Improved regex to handle distro names with spaces and various formats
          // Match: optional * and spaces, then distro name (can have spaces), then state, then version
          // Use a more flexible approach: split by multiple spaces or tabs
          let distroName = '';
          let state = '';
          let version = '';
          
          // Try regex first
          const regexMatch = line.match(/^\s*[\*]?\s*(.+?)\s+(Stopped|Running)\s+(\d+)/);
          if (regexMatch) {
              distroName = regexMatch[1].trim();
              state = regexMatch[2];
              version = regexMatch[3];
          } else {
              // Fallback: split by multiple spaces/tabs
              const trimmedLine = line.trim();
              // Remove leading * if present
              const cleanLine = trimmedLine.startsWith('*') ? trimmedLine.substring(1).trim() : trimmedLine;
              const parts = cleanLine.split(/\s{2,}|\t+/).filter(p => p.trim().length > 0);
              if (parts.length >= 3) {
                  distroName = parts[0].trim();
                  state = parts[1].trim();
                  version = parts[2].trim();
              } else if (parts.length >= 2) {
                  // Try to find state and version in remaining parts
                  distroName = parts[0].trim();
                  // Look for Stopped or Running
                  const stateMatch = cleanLine.match(/\b(Stopped|Running)\b/);
                  const versionMatch = cleanLine.match(/\b(\d+)\b/);
                  if (stateMatch) state = stateMatch[1];
                  if (versionMatch) version = versionMatch[1];
              }
          }
          
          if (distroName && (state === 'Stopped' || state === 'Running')) {
              // Skip Docker-related WSL distros
              if (distroName === 'docker-desktop' || distroName === 'docker-desktop-data') {
                  console.log('DaSSHboard: Skipping Docker-related WSL distro:', distroName);
                  continue;
              }
              
              console.log('DaSSHboard: Found WSL distro:', distroName);
              
              // Get settings for this WSL distro
              const settings = getHostSettings(distroName);
              
              // Try to detect distro type (don't block on this - add distro even if detection fails)
              let distroType = 'Linux';
              try {
                  // Try to get distro name from /etc/os-release
                  // Try bash first, then fall back to sh if bash is not available
                  let osRelease = '';
                  try {
                      const result = await execAsync(`wsl -d "${distroName}" -e bash -c "cat /etc/os-release 2>/dev/null || echo ''"`, {
                          encoding: 'utf8',
                          windowsHide: true,
                          timeout: 5000
                      });
                      osRelease = result.stdout;
                  } catch (bashError) {
                      // Fall back to sh if bash fails
                      try {
                          const result = await execAsync(`wsl -d "${distroName}" -e sh -c "cat /etc/os-release 2>/dev/null || echo ''"`, {
                              encoding: 'utf8',
                              windowsHide: true,
                              timeout: 5000
                          });
                          osRelease = result.stdout;
                      } catch (shError) {
                          console.log(`DaSSHboard: Could not execute command in ${distroName}: ${shError}`);
                      }
                  }
                  
                  if (osRelease) {
                      // Parse PRETTY_NAME or NAME from os-release
                      // Handle both quoted and unquoted values
                      const prettyNameMatch = osRelease.match(/PRETTY_NAME=["']?([^"'\n]+)["']?/i);
                      const nameMatch = osRelease.match(/^NAME=["']?([^"'\n]+)["']?/im);
                      const idMatch = osRelease.match(/^ID=["']?([^"'\n]+)["']?/im);
                      
                      if (prettyNameMatch) {
                          // Get first word from PRETTY_NAME (e.g., "Ubuntu" from "Ubuntu 22.04.3 LTS")
                          distroType = prettyNameMatch[1].trim().split(/\s+/)[0];
                      } else if (nameMatch) {
                          // Get first word from NAME
                          distroType = nameMatch[1].trim().split(/\s+/)[0];
                      } else if (idMatch) {
                          // Use ID as fallback (e.g., "ubuntu", "debian")
                          // Capitalize first letter
                          const id = idMatch[1].trim().toLowerCase();
                          distroType = id.charAt(0).toUpperCase() + id.slice(1);
                      }
                      
                      console.log(`DaSSHboard: Detected distro type for ${distroName}: ${distroType}`);
                  }
              } catch (error) {
                  // If we can't detect, default to "Linux" - but still add the distro
                  console.log(`DaSSHboard: Could not detect distro type for ${distroName}, using default: ${error}`);
              }
              
              distros.push({
                  name: distroName,
                  hostname: distroName,
                  type: 'wsl',
                  settings: settings,
                  distroType: distroType
              });
          } else {
              // Log lines that don't match for debugging
              console.log('DaSSHboard: Line did not match regex pattern:', line);
          }
      }

      console.log(`DaSSHboard: Found ${distros.length} WSL distro(s)`);
      return distros;
  } catch (error) {
      console.error('DaSSHboard: Error getting WSL distros:', error);
      return [];
  }
}

/**
* Gets settings for a specific host from VS Code settings.
*/
function getHostSettings(host: string): HostSettings {
  const config = vscode.workspace.getConfiguration('daSSHboard');
  const hostsConfig = config.get<Record<string, HostSettings>>('hosts') || {};
  
  // Return existing settings if found
  if (hostsConfig[host]) {
      return hostsConfig[host];
  }
  
  // Return default settings
  return {
      folders: [], // Will be replaced with /home/user later
      color: '',
      icon: ''
  };
}

/**
* Checks if Docker/Container extension is installed in VSCode/Cursor.
*/
function isDockerExtensionInstalled(): boolean {
  // Check for the official Docker extension
  const msDockerExtension = vscode.extensions.getExtension('ms-azuretools.vscode-docker');
  // Check for Cursor/AnySphere Container Tools extension
  const containerToolsExtension = vscode.extensions.getExtension('anysphere.containertools');
  // Also check for the Dev Containers extension
  const devContainersExtension = vscode.extensions.getExtension('ms-vscode-remote.remote-containers');
  
  return msDockerExtension !== undefined || 
         containerToolsExtension !== undefined || 
         devContainersExtension !== undefined;
}

/**
* Gets all running Docker containers.
* Returns an array of Docker container configurations.
*/
async function getDockerContainers(): Promise<HostConfig[]> {
  // Check if Docker/Container extension is installed (preferred but not required)
  const hasExtension = isDockerExtensionInstalled();
  console.log('DaSSHboard: Docker/Container extension installed:', hasExtension);

  try {
      console.log('DaSSHboard: Attempting to detect Docker containers...');
      
      // Execute docker ps to get running containers
      // Use --no-trunc to get full container ID (64 chars hex)
      // Format: FullID|Name|Image|Status
      const { stdout } = await execAsync('docker ps --no-trunc --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}"', { 
          windowsHide: true,
          timeout: 5000  // 5 second timeout
      });

      console.log('DaSSHboard: Docker command output:', stdout);
      
      const lines = stdout.split(/\r?\n/).filter(line => line.trim());
      const containers: HostConfig[] = [];

      for (const line of lines) {
          if (!line.trim()) {continue;}

          const parts = line.split('|');
          if (parts.length >= 4) {
              const containerId = parts[0].trim().toLowerCase(); // Full 64-char hex ID, lowercase
              const containerName = parts[1].trim();
              const imageInfo = parts[2].trim();
              const status = parts[3].trim();
              
              console.log('DaSSHboard: Found Docker container:', containerName, 'Full ID:', containerId.substring(0, 12) + '...');
              
              // Docker containers don't use extension settings - return empty settings
              // Only section color is configurable, not individual container settings
              const settings: HostSettings = {
                  folders: [],  // Will be forced to ['/'] in generateHostCards
                  color: '',     // Not used for Docker containers
                  icon: ''       // Will be forced to 'docker.svg' in generateHostCards
              };
              
              containers.push({
                  name: containerName,
                  hostname: containerName,
                  type: 'docker',
                  containerId: containerId, // Full 64-character hex ID
                  containerStatus: status,
                  imageInfo: imageInfo,
                  settings: settings
              });
          }
      }

      console.log(`DaSSHboard: Found ${containers.length} Docker container(s)`);
      return containers;
  } catch (error) {
      console.error('DaSSHboard: Error getting Docker containers:', error);
      console.error('DaSSHboard: Make sure Docker is installed and running');
      return [];
  }
}

/**
* Gets all hosts: combines SSH hosts and WSL distros.
* Returns them in separate arrays for organized display.
*/
async function getAllHosts(): Promise<{
  ssh: HostConfig[];
  wsl: HostConfig[];
  docker: HostConfig[];
}> {
  const sshHosts = await getSshHosts();
  const wslDistros = await getWslDistros();
  const dockerContainers = await getDockerContainers();
  
  return {
      ssh: sshHosts,
      wsl: wslDistros,
      docker: dockerContainers
  };
}

/**
* Generates HTML cards for a list of hosts.
*/
function generateHostCards(hosts: HostConfig[], extensionUri: vscode.Uri, webview: vscode.Webview): string {
  let hostCards = '';
  
  for (const host of hosts) {
          // Create paths to the icons
          const currentWindowIconPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'current-window.svg'));
          const newWindowIconPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'new-window.svg'));
          
          // Custom icon color style and classes for SVG coloring
          let iconColorStyle = '';
          let actionButtonClass = '';
          
          // Docker containers don't use individual host colors - they use section color or theme default
          if (host.type === 'docker') {
              // Docker containers always use theme default color (section color applies to section title only)
              actionButtonClass = 'default-colored';
          } else if (host.settings.color) {
              // Custom color provided in settings - only apply to icons, not background
              iconColorStyle = `style="color: ${host.settings.color}; --host-color: ${host.settings.color}; --host-color-hue: ${getHue(host.settings.color)};"`;
              actionButtonClass = 'host-colored';
          } else {
              // No custom color - use default text link color for icons
              actionButtonClass = 'default-colored';
          }
          
          // Custom host icon if specified
          // ▒▒ Custom host icon  ▒▒
          let hostIconHtml = '';
          
          // Docker containers always use docker.svg icon (not modifiable)
          let iconToUse: string;
          if (host.type === 'docker') {
              iconToUse = 'docker.svg'; // Fixed docker icon
          } else {
              iconToUse = host.settings.icon || 'lucide:server'; // Default to Lucide server icon
          }

          // Docker containers: icons are not clickable and cannot be modified
          const isDocker = host.type === 'docker';
          const clickableClass = isDocker ? '' : 'clickable-host-icon';
          const iconTitle = isDocker ? '' : 'title="Click to change icon and color"';
          const escapedHostName = host.name.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          const iconDataAttrs = isDocker ? '' : `data-host="${escapedHostName}" data-host-type="${host.type}"`;

          // Always render icon (use default if not set)
          {

            /* ─── 1 ▸ “codicon:” or “$(cloud)” syntax  ─── */
            const lucideMatch = iconToUse.match(/^lucide:(.+)$/i);
            
            if (lucideMatch) {
              const lucideIconName = lucideMatch[1].trim();
              
              // Render Lucide icon using data-lucide attribute
              // The icon will be initialized by lucide.createIcons() in the webview script
              // Docker containers don't use custom colors - use theme default
              if (isDocker) {
                // Docker: use theme default color, not clickable
                hostIconHtml = `
                  <i data-lucide="${lucideIconName}"
                     class="host-icon lucide-icon theme-colored-lucide"
                     style="width: 24px; height: 24px; color: var(--vscode-textLink-foreground);"></i>`;
              } else if (host.settings.color) {
                hostIconHtml = `
                  <i data-lucide="${lucideIconName}"
                     class="host-icon ${clickableClass} lucide-icon"
                     ${iconDataAttrs}
                     style="width: 24px; height: 24px; color: ${host.settings.color}; --host-color: ${host.settings.color}; --host-color-hue: ${getHue(host.settings.color)};"
                     ${iconTitle}></i>`;
              } else {
                // For default color, use CSS variable for theme color
                hostIconHtml = `
                  <i data-lucide="${lucideIconName}"
                     class="host-icon ${clickableClass} lucide-icon theme-colored-lucide"
                     ${iconDataAttrs}
                     style="width: 24px; height: 24px; color: var(--vscode-textLink-foreground);"
                     ${iconTitle}></i>`;
              }
            }
            /* ─── 2 ▸ otherwise treat value as local SVG filename (existing logic) ─── */
            else {
              let iconFileName = iconToUse.endsWith('.svg')
                                 ? iconToUse
                                 : `${iconToUse}.svg`;

              const hostIconPath = webview.asWebviewUri(
                  vscode.Uri.joinPath(extensionUri, 'media', 'hosts', iconFileName));
              const hostIconWhitePath = webview.asWebviewUri(
                  vscode.Uri.joinPath(extensionUri, 'media', 'hosts',
                                      `${path.parse(iconFileName).name}_white.svg`));

              const iconClass = host.settings.color ? 'custom-colored-svg' : 'theme-colored-svg';

              if (isDocker) {
                  // Docker: use theme-colored approach, not clickable
                  hostIconHtml = `
                    <span class="host-icon-wrapper theme-colored-icon-wrapper light-theme-only" style="--icon-src: url('${hostIconPath}');">
                      <span class="host-icon theme-colored-svg"></span>
                    </span>
                    <span class="host-icon-wrapper theme-colored-icon-wrapper dark-theme-only" style="--icon-src: url('${hostIconWhitePath}');">
                      <span class="host-icon theme-colored-svg"></span>
                    </span>`;
              } else if (host.settings.color) {
                  hostIconHtml = `
                    <img src="${hostIconPath}"
                         class="host-icon ${iconClass} ${clickableClass} light-theme-only"
                         ${iconColorStyle}
                         ${iconDataAttrs}
                         alt="${host.name} icon"
                         ${iconTitle} />
                    <img src="${hostIconWhitePath}"
                         class="host-icon ${iconClass} ${clickableClass} dark-theme-only"
                         ${iconColorStyle}
                         ${iconDataAttrs}
                         alt="${host.name} icon"
                         ${iconTitle}/>`;
              } else {
                  // For default color, use mask approach with textLink color
                  hostIconHtml = `
                    <span class="host-icon-wrapper theme-colored-icon-wrapper light-theme-only" style="--icon-src: url('${hostIconPath}');">
                      <span class="host-icon theme-colored-svg ${clickableClass}"
                           ${iconDataAttrs}
                           ${iconTitle}></span>
                    </span>
                    <span class="host-icon-wrapper theme-colored-icon-wrapper dark-theme-only" style="--icon-src: url('${hostIconWhitePath}');">
                      <span class="host-icon theme-colored-svg ${clickableClass}"
                           ${iconDataAttrs}
                           ${iconTitle}></span>
                    </span>`;
              }
            }
            }
          
          
          // Display connection details based on host type
          let connectionDetail = '';
          let hostTypeBadge = '';
          
          if (host.type === 'ssh') {
              connectionDetail = host.user 
                  ? `${host.user}@${host.hostname}` 
                  : host.hostname;
              hostTypeBadge = '<span class="host-type-badge ssh-badge">SSH</span>';
          } else if (host.type === 'wsl') {
              connectionDetail = host.distroType || 'WSL Distro';
              hostTypeBadge = '<span class="host-type-badge wsl-badge">WSL</span>';
          } else if (host.type === 'docker') {
              connectionDetail = host.imageInfo || 'Docker Container';
              hostTypeBadge = '<span class="host-type-badge docker-badge">DOCKER</span>';
          }
          
          // Get folders (default based on type)
          let folders: string[];
          if (host.type === 'docker') {
              // Docker containers always show root folder only
              folders = ['/'];
          } else if (host.settings.folders && host.settings.folders.length > 0) {
              folders = host.settings.folders;
          } else {
              folders = [host.user === "root" ? "/root" : `/home/${host.user}`];
          }
          
          // For Docker containers, pass the container name (VS Code remote extension expects name, not ID)
          // For others, pass the name
          const identifier = host.name;
          
          // Escape special characters for HTML attributes
          const escapedIdentifier = identifier.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          const escapedType = host.type;
          
          // Create folder entries
          let folderEntries = '';
          for (const folder of folders) {
              // Escape special characters for HTML attributes
              const escapedFolder = folder.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
              
              folderEntries += `
              <div class="folder-entry">
                  <span class="folder-path" title="${folder.replace(/"/g, '&quot;')}">${folder}</span>
                  <div class="folder-actions">
                      <button class="action-button ${actionButtonClass}" 
                              ${host.settings.color ? iconColorStyle : ''} 
                              data-host="${escapedIdentifier}" 
                              data-folder="${escapedFolder}" 
                              data-type="${escapedType}"
                              data-new-window="false">
                          <span class="action-icon" style="--icon-src: url('${currentWindowIconPath}');" aria-label="Current window"></span>
                          <span class="tooltip">Open in current window</span>
                      </button>
                      <button class="action-button ${actionButtonClass}" 
                              ${host.settings.color ? iconColorStyle : ''} 
                              data-host="${escapedIdentifier}" 
                              data-folder="${escapedFolder}" 
                              data-type="${escapedType}"
                              data-new-window="true">
                          <span class="action-icon" style="--icon-src: url('${newWindowIconPath}');" aria-label="New window"></span>
                          <span class="tooltip">Open in new window</span>
                      </button>
                  </div>
              </div>`;
          }
          
          hostCards += `
          <div class="host-card ${host.type}-host" ${host.settings.color ? iconColorStyle : ''}>
              <div class="host-header" ${host.settings.color ? iconColorStyle : ''}>
                  <div class="host-header-row">
                      <div class="host-name-container">
                          ${hostIconHtml}
                          <h2 class="host-name">${host.name}</h2>
                      </div>
                      ${hostTypeBadge}
                  </div>
                  <div class="host-connection-row">
                      <span class="host-connection">${connectionDetail}</span>
                  </div>
              </div>
              <div class="folders-container">
                  ${folderEntries}
              </div>
          </div>`;
  }
  
  return hostCards;
}

/**
* Generates the HTML content for the custom welcome dashboard webview.
* It takes separate arrays of SSH hosts, WSL distros, and Docker containers
* and creates organized sections for each type.
*/
function getWebviewContent(
  hosts: { ssh: HostConfig[]; wsl: HostConfig[]; docker: HostConfig[] },
  extensionUri: vscode.Uri,
  webview: vscode.Webview
): string {
  // Get section colors and collapsed states from settings
  const config = vscode.workspace.getConfiguration('daSSHboard');
  const sshSectionColor = config.get<string>('sshSectionColor', '');
  const wslSectionColor = config.get<string>('wslSectionColor', '');
  const dockerSectionColor = config.get<string>('dockerSectionColor', '');
  const sshSectionCollapsed = config.get<boolean>('sshSectionCollapsed', false);
  const wslSectionCollapsed = config.get<boolean>('wslSectionCollapsed', false);
  const dockerSectionCollapsed = config.get<boolean>('dockerSectionCollapsed', false);
  const globalLayout = config.get<string>('layout', 'grid');
  
  // Detect the type of remote connection
  const remoteName = vscode.env.remoteName;
  let remoteType: 'ssh' | 'wsl' | 'docker' | null = null;
  let closeButtonText = '';
  
  if (remoteName === 'ssh-remote') {
      remoteType = 'ssh';
      closeButtonText = 'Close SSH Connection';
  } else if (remoteName === 'wsl') {
      remoteType = 'wsl';
      closeButtonText = 'Close WSL Connection';
  } else if (remoteName && (remoteName.startsWith('attached-container') || remoteName.startsWith('dev-container'))) {
      remoteType = 'docker';
      closeButtonText = 'Close Container Connection';
  }

  // Generate cards for each section
  const sshCards = generateHostCards(hosts.ssh, extensionUri, webview);
  const wslCards = generateHostCards(hosts.wsl, extensionUri, webview);
  const dockerCards = generateHostCards(hosts.docker, extensionUri, webview);

  // Build section HTML
  let sectionsHtml = '';
  
  // Helper function to generate section title with color palette and collapse button
  const generateSectionTitle = (sectionType: 'ssh' | 'wsl' | 'docker', title: string, count: number, color: string, collapsed: boolean) => {
      const colorPaletteId = `${sectionType}-color-palette`;
      const currentColor = color || '';
      
      // Build color palette grid
      // First color is empty string representing theme default (vscode-textLink-foreground)
      let colorGrid = '';
      const colorPalette = [
                 '', "#ffadad","#ffd6a5","#fdffb6","#caffbf","#9bf6ff","#a0c4ff","#bdb2ff","#ffc6ff","#ffd9d9",
          '#000000', "#e03524","#f07c12","#ffc200","#90bc1a","#21b534","#0095ac","#1f64ad","#4040a0","#903498",
          '#888888', "#f94144","#f3722c","#f8961e","#f9c74f","#90be6d","#43aa8b","#4d908e","#577590","#277da1",
          '#ffffff', "#ef476f","#f78c6b","#ffd166","#83d483","#06d6a0","#0cb0a9","#118ab2","#0c637f","#073b4c"
      ];
      
      colorPalette.forEach((paletteColor, index) => {
          const isSelected = paletteColor === currentColor ? 'selected' : '';
          // First color (index 0) is empty, use CSS variable for display
          const displayColor = index === 0 ? 'var(--vscode-textLink-foreground)' : paletteColor;
          const colorTitle = index === 0 ? 'Theme default (textLink)' : paletteColor;
          colorGrid += '<div class="section-color-option ' + isSelected + (index === 0 ? ' theme-default-color' : '') + '" data-color="' + paletteColor + '" data-section="' + sectionType + '" style="background-color: ' + displayColor + ';" title="' + colorTitle + '"></div>';
      });
      
      // Use CSS variable for preview if no color is set (theme default)
      const previewColor = currentColor || 'var(--vscode-textLink-foreground)';
      
      // Section-specific icons - colored with section color
      const sectionIconColor = currentColor || 'var(--vscode-textLink-foreground)';
      let sectionIcon = '';
      if (sectionType === 'wsl') {
        // Use the same docker.svg icon as host cards
        const wslIconPath = webview.asWebviewUri(
            vscode.Uri.joinPath(extensionUri, 'media', 'hosts', 'linux_white.svg'));
        
        // Use section color for Docker icon with inline style
        sectionIcon = `
            <span class="section-icon-wrapper theme-colored-icon-wrapper dark-theme-only" style="--icon-src: url('${wslIconPath}'); width: 18px; height: 18px; display: inline-block;">
                <span class="section-icon theme-colored-svg" style="width: 18px; height: 18px; background-color: ${sectionIconColor};"></span>
            </span>`;
      } else if (sectionType === 'docker') {
          // Use the same docker.svg icon as host cards
          const dockerIconPath = webview.asWebviewUri(
              vscode.Uri.joinPath(extensionUri, 'media', 'hosts', 'docker_white.svg'));
          
          // Use section color for Docker icon with inline style
          sectionIcon = `
              <span class="section-icon-wrapper theme-colored-icon-wrapper dark-theme-only" style="--icon-src: url('${dockerIconPath}'); width: 18px; height: 18px; display: inline-block;">
                  <span class="section-icon theme-colored-svg" style="width: 18px; height: 18px; background-color: ${sectionIconColor};"></span>
              </span>`;
      } else {
            const sshIconPath = webview.asWebviewUri(
                vscode.Uri.joinPath(extensionUri, 'media', 'hosts', 'monitor.svg'));
            
            // Use section color for Docker icon with inline style
            sectionIcon = `
                <span class="section-icon-wrapper theme-colored-icon-wrapper dark-theme-only" style="--icon-src: url('${sshIconPath}'); width: 18px; height: 18px; display: inline-block;">
                    <span class="section-icon theme-colored-svg" style="width: 18px; height: 18px; background-color: ${sectionIconColor};"></span>
                </span>`;
      }
      
      return `
          <h2 class="section-title ${sectionType}-section-title" style="border-bottom-color: ${sectionIconColor};">
              <button class="section-collapse-button" data-section="${sectionType}" title="${collapsed ? 'Expand' : 'Collapse'} section">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="${collapsed ? '9 18 15 12 9 6' : '6 9 12 15 18 9'}"></polyline>
                  </svg>
              </button>
              ${sectionIcon}
              ${title}
              <span class="section-count" style="background-color: ${sectionIconColor};">${count}</span>
              <div class="section-color-palette-container" id="${colorPaletteId}" title="Change ${sectionType.toUpperCase()} section color">
                  <div class="section-color-palette-preview" style="background-color: ${previewColor};"></div>
                  <div class="section-color-palette-grid">
                      ${colorGrid}
                  </div>
              </div>
          </h2>`;
  };
  
  // SSH Hosts Section
  if (hosts.ssh.length > 0) {
      // Only set the CSS variable when there's an actual color value
      const sectionColorStyle = sshSectionColor ? `style="--section-color: ${sshSectionColor};"` : '';
      const collapsedClass = sshSectionCollapsed ? 'collapsed' : '';
      sectionsHtml += `
      <div class="section ssh-section ${collapsedClass}" ${sectionColorStyle}>
          ${generateSectionTitle('ssh', 'SSH Remote Hosts', hosts.ssh.length, sshSectionColor, sshSectionCollapsed)}
          <div class="host-grid layout-${globalLayout}">
              ${sshCards}
          </div>
      </div>`;
  }
  
  // WSL Distros Section
  if (hosts.wsl.length > 0) {
      // Only set the CSS variable when there's an actual color value
      const sectionColorStyle = wslSectionColor ? `style="--section-color: ${wslSectionColor};"` : '';
      const collapsedClass = wslSectionCollapsed ? 'collapsed' : '';
      sectionsHtml += `
      <div class="section wsl-section ${collapsedClass}" ${sectionColorStyle}>
          ${generateSectionTitle('wsl', 'WSL Distros', hosts.wsl.length, wslSectionColor, wslSectionCollapsed)}
          <div class="host-grid layout-${globalLayout}">
              ${wslCards}
          </div>
      </div>`;
  }
  
  // Docker Containers Section
  if (hosts.docker.length > 0) {
      // Only set the CSS variable when there's an actual color value
      const sectionColorStyle = dockerSectionColor ? `style="--section-color: ${dockerSectionColor};"` : '';
      const collapsedClass = dockerSectionCollapsed ? 'collapsed' : '';
      sectionsHtml += `
      <div class="section docker-section ${collapsedClass}" ${sectionColorStyle}>
          ${generateSectionTitle('docker', 'Docker Containers', hosts.docker.length, dockerSectionColor, dockerSectionCollapsed)}
          <div class="host-grid layout-${globalLayout}">
              ${dockerCards}
          </div>
      </div>`;
  }
  
  // No hosts message
  if (hosts.ssh.length === 0 && hosts.wsl.length === 0 && hosts.docker.length === 0) {
      sectionsHtml = '<p class="no-hosts">No SSH hosts, WSL distros, or Docker containers found.</p>';
  }

  /* extra button (remote-only) - shows when in SSH, WSL, or Docker remote context */
  let closeRemoteButtonHtml = '';
  if (remoteType) {
      // Get section color for the button border
      let sectionColor = '';
      if (remoteType === 'ssh') {
          sectionColor = sshSectionColor || '';
      } else if (remoteType === 'wsl') {
          sectionColor = wslSectionColor || '';
      } else if (remoteType === 'docker') {
          sectionColor = dockerSectionColor || '';
      }
      
      // Different button styles based on connection type
      let buttonClass = 'close-remote-button';
      if (remoteType === 'ssh') {
          buttonClass = 'close-remote-button close-ssh-button';
      } else if (remoteType === 'wsl') {
          buttonClass = 'close-remote-button close-wsl-button';
      } else if (remoteType === 'docker') {
          buttonClass = 'close-remote-button close-docker-button';
      }
      
      const buttonStyle = sectionColor ? `style="--section-color: ${sectionColor};"` : '';
      
      closeRemoteButtonHtml = `
        <button class="config-button ${buttonClass}" ${buttonStyle} onclick="closeRemote()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          ${closeButtonText}
        </button>`;
  }
  const dashboardCss = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'dasshboard.css')
  );
  const lucideJs = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'lucide.min.js')
  );
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DaSSHboard</title>
<link href="${dashboardCss}" rel="stylesheet" />
<script src="${lucideJs}"></script>
</head>
<body>
<div class="container">
  ${sectionsHtml}
</div>
<footer align-items: center, gap: 20px>
  <button class="config-button layout-toggle-button" onclick="toggleLayout()" data-layout="${globalLayout}">
    ${globalLayout === 'grid' 
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        Grid View`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        List View`}
  </button>
  <button class="config-button" onclick="openDaSSHboardSetting()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V20a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V4a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8a1.65 1.65 0 0 0 1.51 1H20a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
    Open DaSSHboard settings
  </button>
  <button class="config-button" onclick="openDashboardPathsSetting()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
    Configure path entrypoints
  </button>
  <button class="config-button ssh-config-button" onclick="openSshConfig()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="4 17 10 11 4 5"/>
      <line x1="12" y1="19" x2="20" y2="19"/>
    </svg>
    Open SSH Config
  </button>
  ${closeRemoteButtonHtml}
</footer>
<script>
  const vscode = acquireVsCodeApi();
  
  // Event delegation for action buttons
  document.addEventListener('click', function(event) {
      const button = event.target.closest('.action-button');
      if (button && button.dataset.host) {
          const host = button.dataset.host;
          const folder = button.dataset.folder;
          const newWindow = button.dataset.newWindow === 'true';
          const hostType = button.dataset.type;
          
          console.log('Button clicked - Host:', host.substring(0, 20) + '...', 'Folder:', folder, 'Type:', hostType);
          
          vscode.postMessage({
              command: 'openFolder',
              host: host,
              folder: folder,
              newWindow: newWindow,
              hostType: hostType
          });
          return;
      }
  });
  
  function openSshConfig() {
      vscode.postMessage({
          command: 'openSshConfig'
      });
  }

  function openDaSSHboardSetting() {
      vscode.postMessage({
          command: 'openDaSSHboardSetting'
      });
  }

  function openDashboardPathsSetting() {
      vscode.postMessage({
          command: 'openDashboardPathsSetting'
      });
  }

  function closeRemote() {
      vscode.postMessage({
          command: 'closeRemote'
      });
  }

  function toggleLayout() {
      const button = document.querySelector('.layout-toggle-button');
      const currentLayout = button.dataset.layout;
      const newLayout = currentLayout === 'grid' ? 'list' : 'grid';
      
      // Update all host grids
      document.querySelectorAll('.host-grid').forEach(grid => {
          grid.classList.remove('layout-grid', 'layout-list');
          grid.classList.add('layout-' + newLayout);
      });
      
      // Update button
      button.dataset.layout = newLayout;
      if (newLayout === 'grid') {
          button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> Grid View';
      } else {
          button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> List View';
      }
      
      vscode.postMessage({
          command: 'updateLayout',
          layout: newLayout
      });
  }
  
  // Handle section collapse/expand button clicks
  document.addEventListener('click', function(event) {
      const collapseButton = event.target.closest('.section-collapse-button');
      if (collapseButton && collapseButton.dataset.section) {
          const section = collapseButton.dataset.section;
          const sectionElement = collapseButton.closest('.section');
          if (sectionElement) {
              const isCollapsed = sectionElement.classList.contains('collapsed');
              
              // Toggle collapsed state
              if (isCollapsed) {
                  sectionElement.classList.remove('collapsed');
              } else {
                  sectionElement.classList.add('collapsed');
              }
              
              // Update icon
              const icon = collapseButton.querySelector('svg polyline');
              if (icon) {
                  if (isCollapsed) {
                      icon.setAttribute('points', '6 9 12 15 18 9');
                  } else {
                      icon.setAttribute('points', '9 18 15 12 9 6');
                  }
              }
              
              // Update button title
              collapseButton.title = isCollapsed ? 'Collapse section' : 'Expand section';
              
              // Save state
              vscode.postMessage({
                  command: 'updateSectionCollapsed',
                  section: section,
                  collapsed: !isCollapsed
              });
              
              event.stopPropagation();
          }
      }
  });
  
  // Handle section color palette toggle and selection
  document.addEventListener('click', function(event) {
      const colorPaletteContainer = event.target.closest('.section-color-palette-container');
      const colorOption = event.target.closest('.section-color-option');
      const preview = event.target.closest('.section-color-palette-preview');
      
      // Toggle palette visibility when clicking the preview
      if (preview && colorPaletteContainer) {
          const isActive = colorPaletteContainer.classList.contains('active');
          document.querySelectorAll('.section-color-palette-container').forEach(c => c.classList.remove('active'));
          if (!isActive) {
              colorPaletteContainer.classList.add('active');
          }
          event.stopPropagation();
          return;
      }
      
      // Handle color selection
      if (colorOption && colorOption.dataset.section) {
          const section = colorOption.dataset.section;
          const color = colorOption.dataset.color;
          
          // Update selected state
          const container = colorOption.closest('.section-color-palette-container');
          if (container) {
              container.querySelectorAll('.section-color-option').forEach(opt => opt.classList.remove('selected'));
              colorOption.classList.add('selected');
              
              // Update preview color
              const previewElement = container.querySelector('.section-color-palette-preview');
              if (previewElement) {
                  // Use CSS variable for empty string (theme default), otherwise use the color
                  previewElement.style.backgroundColor = color || 'var(--vscode-textLink-foreground)';
              }
              
              container.classList.remove('active');
          }
          
          vscode.postMessage({
              command: 'updateSectionColor',
              section: section,
              color: color
          });
          event.stopPropagation();
      } else if (!colorPaletteContainer) {
          // Close all palettes when clicking outside
          document.querySelectorAll('.section-color-palette-container').forEach(c => c.classList.remove('active'));
      }
  });
  
  // Handle host icon clicks
  document.addEventListener('click', function(event) {
      const icon = event.target.closest('.clickable-host-icon');
      if (icon && icon.dataset.host) {
          const host = icon.dataset.host;
          const hostType = icon.dataset.hostType;
          openIconSelector(host, hostType);
      }
  });
  
  // Curated Lucide icons for machines, operating systems, and servers
  const lucideIcons = [
      // Servers & Infrastructure
      'server', 'server-cog', 'server-off', 'server-crash',
      // Machines & Devices
      'computer', 'laptop', 'monitor', 'tablet', 'smartphone', 'cpu', 'hard-drive',
      // Operating Systems & Platforms
      'apple', 'box', 'container',
      // Cloud & Network
      'cloud', 'cloud-off', 'network', 'wifi', 'wifi-off', 'router', 'globe', 'globe-2',
      // Development & Code
      'code', 'code-2', 'terminal', 'folder', 'folder-open', 'file', 'file-code', 'git-branch', 'git-commit',
      // Security
      'shield', 'shield-check', 'lock', 'key', 'fingerprint',
      // Database & Storage
      'database', 'database-backup', 'hard-drive',
      // Monitoring & Activity
      'activity', 'gauge', 'bar-chart', 'trending-up',
      // Other Useful
      'home', 'settings', 'cog', 'wrench', 'package', 'box', 'layers', 'grid', 'zap'
  ];
  
  // Predefined color palette (20 colors)
  // First color is empty string representing theme default (vscode-textLink-foreground)
        const colorPalette = [
                 '', "#ffadad","#ffd6a5","#fdffb6","#caffbf","#9bf6ff","#a0c4ff","#bdb2ff","#ffc6ff","#ffd9d9",
          '#000000', "#e03524","#f07c12","#ffc200","#90bc1a","#21b534","#0095ac","#1f64ad","#4040a0","#903498",
          '#888888', "#f94144","#f3722c","#f8961e","#f9c74f","#90be6d","#43aa8b","#4d908e","#577590","#277da1",
          '#ffffff', "#ef476f","#f78c6b","#ffd166","#83d483","#06d6a0","#0cb0a9","#118ab2","#0c637f","#073b4c"
      ];
  
  function openIconSelector(host, hostType) {
      // Get current icon and color for this host
      vscode.postMessage({
          command: 'getHostSettings',
          host: host,
          hostType: hostType
      });
  }
  
  // Store reference to vscode API for message handling
  const messageHandler = (event) => {
      const message = event.data;
      if (message.command === 'hostSettingsResponse') {
          showIconSelectorModal(message.host, message.hostType, message.currentIcon, message.currentColor);
      }
  };
  
  // Listen for messages from extension
  window.addEventListener('message', messageHandler);
  
  function showIconSelectorModal(host, hostType, currentIcon, currentColor) {
      // Create modal overlay
      const modal = document.createElement('div');
      modal.className = 'icon-selector-modal';
      modal.id = 'iconSelectorModal';
      
      // Parse current icon to get icon name
      let currentIconName = 'server';
      let currentIconType = 'lucide';
      if (currentIcon) {
          const lucideMatch = currentIcon.match(/^lucide:(.+)$/i);
          if (lucideMatch) {
              currentIconName = lucideMatch[1].trim();
              currentIconType = 'lucide';
          }
      }
      
      const currentColorValue = currentColor || '';
      
      // Find closest color in palette if current color is not in palette
      let selectedColor = currentColorValue;
      if (currentColorValue && colorPalette.indexOf(currentColorValue) === -1) {
          // If current color is not in palette, default to first color (theme default)
          selectedColor = colorPalette[0];
      } else if (!currentColorValue) {
          // If no color set, use first color (theme default)
          selectedColor = colorPalette[0];
      }
      
      // Build color palette
      let colorGrid = '';
      colorPalette.forEach((color, index) => {
          const isSelected = color === selectedColor ? 'selected' : '';
          // First color (index 0) is empty string, use CSS variable for display
          const displayColor = index === 0 ? 'var(--vscode-textLink-foreground)' : color;
          const colorTitle = index === 0 ? 'Theme default (textLink)' : color;
          colorGrid += '<div class="color-option ' + isSelected + (index === 0 ? ' theme-default-color' : '') + '" data-color="' + color + '" style="background-color: ' + displayColor + ';" title="' + colorTitle + '"></div>';
      });
      
      // Build icon grid with Lucide icons
      let iconGrid = '';
      lucideIcons.forEach(iconName => {
          const isSelected = (iconName === currentIconName && currentIconType === 'lucide') ? 'selected' : '';
          iconGrid += '<div class="icon-option ' + isSelected + '" data-icon="lucide:' + iconName + '">' +
                      '<i data-lucide="' + iconName + '" class="lucide-icon-preview" style="width: 32px; height: 32px; color: var(--vscode-foreground);"></i>' +
                      '<span>' + iconName + '</span></div>';
      });
      
      const escapedHost = host.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const escapedHostType = hostType.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      
      modal.innerHTML = 
          '<div class="icon-selector-content">' +
              '<div class="icon-selector-header">' +
                  '<h3>Customize Icon for ' + escapedHost + '</h3>' +
                  '<button class="icon-selector-close" onclick="closeIconSelector()">&times;</button>' +
              '</div>' +
              '<div class="icon-selector-body">' +
                  '<div class="icon-selector-section">' +
                      '<label>Icon Color:</label>' +
                      '<div class="color-palette-grid">' +
                          colorGrid +
                      '</div>' +
                  '</div>' +
                  '<div class="icon-selector-section">' +
                      '<label>Icon Type:</label>' +
                      '<div class="icon-grid">' +
                          iconGrid +
                      '</div>' +
                  '</div>' +
              '</div>' +
              '<div class="icon-selector-footer">' +
                  '<button class="icon-selector-button" onclick="saveHostIcon(\\'' + escapedHost + '\\', \\'' + escapedHostType + '\\')">Save</button>' +
                  '<button class="icon-selector-button secondary" onclick="closeIconSelector()">Cancel</button>' +
              '</div>' +
          '</div>';
      
      document.body.appendChild(modal);
      
      // Handle color selection
      modal.querySelectorAll('.color-option').forEach(option => {
          option.addEventListener('click', function() {
              modal.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
              this.classList.add('selected');
          });
      });
      
      // Handle icon selection
      modal.querySelectorAll('.icon-option').forEach(option => {
          option.addEventListener('click', function() {
              modal.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
              this.classList.add('selected');
          });
      });
      
      // Initialize Lucide icons in the modal
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
          if (typeof lucide !== 'undefined') {
              lucide.createIcons();
          }
      }, 50);
  }
  
  function closeIconSelector() {
      const modal = document.getElementById('iconSelectorModal');
      if (modal) {
          modal.remove();
      }
  }
  
  function saveHostIcon(host, hostType) {
      const modal = document.getElementById('iconSelectorModal');
      if (!modal) return;
      
      const selectedIcon = modal.querySelector('.icon-option.selected');
      const selectedColor = modal.querySelector('.color-option.selected');
      
      if (!selectedIcon) {
          alert('Please select an icon');
          return;
      }
      
      if (!selectedColor) {
          alert('Please select a color');
          return;
      }
      
      const icon = selectedIcon.dataset.icon;
      const color = selectedColor.dataset.color;
      
      vscode.postMessage({
          command: 'updateHostIcon',
          host: host,
          hostType: hostType,
          icon: icon,
          color: color
      });
      
      closeIconSelector();
  }
  
  // Initialize Lucide icons when page loads and after DOM updates
  function initializeLucideIcons() {
      if (typeof lucide !== 'undefined') {
          lucide.createIcons();
      }
  }
  
  // Initialize on page load
  setTimeout(() => {
      initializeLucideIcons();
  }, 100);
  
  // Re-initialize Lucide icons after DOM updates (debounced)
  let iconInitTimeout;
  const observer = new MutationObserver((mutations) => {
      // Only re-initialize if elements with data-lucide are added
      const hasLucideElements = mutations.some(mutation => {
          return Array.from(mutation.addedNodes).some(node => {
              if (node.nodeType === 1) { // Element node
                  return node.hasAttribute && node.hasAttribute('data-lucide') ||
                         node.querySelector && node.querySelector('[data-lucide]');
              }
              return false;
          });
      });
      
      if (hasLucideElements) {
          clearTimeout(iconInitTimeout);
          iconInitTimeout = setTimeout(initializeLucideIcons, 100);
      }
  });
  
  // Observe the document body for changes
  observer.observe(document.body, {
      childList: true,
      subtree: true
  });
</script>
</body>
</html>`;
}


// Store reference to the dashboard panel to allow updates
let dashboardPanel: vscode.WebviewPanel | undefined = undefined;

/**
* This method is called when your extension is activated.
*/
export function activate(context: vscode.ExtensionContext) {
  console.log('DaSSHboard: Extension is now active!');
  
  // Check for new hosts and update settings on every activation
  generateDefaultHostSettings().catch(error => {
      console.error('DaSSHboard: Error during settings initialization:', error);
  });

  /* status-bar button (next to Remote indicator) */
  /* status-bar button: always 2nd from the left (just after Remote) */
  const cfg       = vscode.workspace.getConfiguration('daSSHboard');
  const iconId    = cfg.get<string>('statusBarIcon', 'gripper'); // Lucide icon name
  const sbPriority =  10000000;   // Remote indicator is 100, so we take 99

  const sb = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    sbPriority
  );
  sb.name    = 'DaSSHboard';
  sb.text    = `$(${iconId}) DaSSHboard`;
  sb.tooltip = 'Show DaSSHboard';
  sb.command = 'dasshboard.showDashboard';
  sb.show();
  context.subscriptions.push(sb);

  // Check if we should open the dashboard on startup
  const openAtStartup = cfg.get<boolean>('openAtStartup', true);
  
  // Use workspace state to track if we've opened the dashboard in this session
  const sessionKey = 'dasshboard.openedInSession';
  const hasOpenedInSession = context.workspaceState.get<boolean>(sessionKey, false);
  
  if (openAtStartup && !hasOpenedInSession) {
      console.log('DaSSHboard: Opening dashboard on startup');
      
      // Mark that we've opened it in this session
      context.workspaceState.update(sessionKey, true);
      
      // Use setTimeout to ensure VS Code is fully initialized
      // This gives VS Code time to load the workspace and UI
      setTimeout(() => {
          vscode.commands.executeCommand('dasshboard.showDashboard');
      }, 500);
  }
  
  // Reset the session flag when window is closed (for next startup)
  // This is handled automatically by workspace state being session-specific

  // Command to show the custom welcome dashboard
  const showDashboardDisposable = vscode.commands.registerCommand('dasshboard.showDashboard', async () => {
      // Check for new hosts before showing the dashboard
      await generateDefaultHostSettings();
      
      // If panel already exists, reveal it and update content, otherwise create new one
      if (dashboardPanel) {
          dashboardPanel.reveal(vscode.ViewColumn.One);
          // Update content with fresh settings (this ensures collapsed state is read from settings)
          const hosts = await getAllHosts();
          dashboardPanel.webview.html = getWebviewContent(hosts, context.extensionUri, dashboardPanel.webview);
          return;
      }
      
      // Create the panel - always create new to ensure fresh state is loaded
      const panel = vscode.window.createWebviewPanel(
          'dasshboard',           // Identifies the type of the webview.
          'DaSSHboard',          // Title of the panel.
          vscode.ViewColumn.One,         // Editor column to show the new webview panel in.
          {
              enableScripts: true,       // Enable JavaScript in the webview
              localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')], // Allow access to the media folder
              retainContextWhenHidden: false // Don't retain context to ensure fresh state is always loaded
          }
      );
      
      // Store panel reference
      dashboardPanel = panel;
      
      // Dispose panel reference when it's closed
      panel.onDidDispose(() => {
          dashboardPanel = undefined;
      });

      const hosts = await getAllHosts();
      panel.webview.html = getWebviewContent(hosts, context.extensionUri, panel.webview);

      // Listen for messages from the webview.
      panel.webview.onDidReceiveMessage(
          message => {
              switch (message.command) {
                  case 'openFolder':
                      console.log('DaSSHboard: Received openFolder message:', {
                          hostLength: message.host?.length,
                          hostPreview: message.host?.substring(0, 20) + '...',
                          folder: message.folder,
                          newWindow: message.newWindow,
                          hostType: message.hostType
                      });
                      vscode.commands.executeCommand('dasshboard.openFolder', 
                          message.host, 
                          message.folder, 
                          message.newWindow,
                          message.hostType);
                      return;
                  case 'openSshConfig':
                      const configPath = path.join(os.homedir(), '.ssh', 'config');
                      vscode.workspace.openTextDocument(configPath).then(doc => {
                          vscode.window.showTextDocument(doc);
                      });
                      return;
                  case 'openDaSSHboardSetting':
                      vscode.commands.executeCommand('workbench.action.openSettings', 'daSSHboard');
                      return;
                  case 'openDashboardPathsSetting':
                      // Open settings.json and navigate to daSSHboard.hosts
                      vscode.commands.executeCommand('workbench.action.openSettingsJson').then(() => {
                          // Wait a bit for the file to open, then search for the hosts setting
                          setTimeout(() => {
                              const editor = vscode.window.activeTextEditor;
                              if (editor) {
                                  const document = editor.document;
                                  const text = document.getText();
                                  const hostsIndex = text.indexOf('"daSSHboard.hosts"');
                                  if (hostsIndex !== -1) {
                                      const position = document.positionAt(hostsIndex);
                                      editor.revealRange(
                                          new vscode.Range(position, position),
                                          vscode.TextEditorRevealType.InCenter
                                      );
                                      editor.selection = new vscode.Selection(position, position);
                                  }
                              }
                          }, 300);
                      });
                      return;
                  case 'closeRemote':
                      vscode.commands.executeCommand('workbench.action.remote.close');
                      return;
                  case 'updateSectionColor':
                      const section = message.section;
                      const color = message.color;
                      let configKey: string;
                      if (section === 'ssh') {
                          configKey = 'sshSectionColor';
                      } else if (section === 'wsl') {
                          configKey = 'wslSectionColor';
                      } else if (section === 'docker') {
                          configKey = 'dockerSectionColor';
                      } else {
                          return;
                      }
                      const config = vscode.workspace.getConfiguration('daSSHboard');
                      config.update(configKey, color, vscode.ConfigurationTarget.Global).then(async () => {
                          // Check for new hosts before reloading
                          await generateDefaultHostSettings();
                          // Reload the webview to apply the new color
                          if (dashboardPanel) {
                              const hosts = await getAllHosts();
                              dashboardPanel.webview.html = getWebviewContent(hosts, context.extensionUri, dashboardPanel.webview);
                          }
                      });
                      return;
                  case 'updateSectionCollapsed':
                      const collapsedSection = message.section;
                      const collapsed = message.collapsed;
                      let collapsedConfigKey: string;
                      if (collapsedSection === 'ssh') {
                          collapsedConfigKey = 'sshSectionCollapsed';
                      } else if (collapsedSection === 'wsl') {
                          collapsedConfigKey = 'wslSectionCollapsed';
                      } else if (collapsedSection === 'docker') {
                          collapsedConfigKey = 'dockerSectionCollapsed';
                      } else {
                          return;
                      }
                      const collapsedConfig = vscode.workspace.getConfiguration('daSSHboard');
                      collapsedConfig.update(collapsedConfigKey, collapsed, vscode.ConfigurationTarget.Global).then(async () => {
                          // Reload the webview to apply the new collapsed state
                          if (dashboardPanel) {
                              const hosts = await getAllHosts();
                              dashboardPanel.webview.html = getWebviewContent(hosts, context.extensionUri, dashboardPanel.webview);
                          }
                      });
                      return;
                  case 'updateLayout':
                      const newLayout = message.layout;
                      const layoutConfig = vscode.workspace.getConfiguration('daSSHboard');
                      layoutConfig.update('layout', newLayout, vscode.ConfigurationTarget.Global);
                      // No need to reload - the JS already updates the DOM
                      return;
                  case 'getHostSettings':
                      const hostName = message.host;
                      const hostConfig = vscode.workspace.getConfiguration('daSSHboard');
                      const hostsConfig = hostConfig.get<Record<string, HostSettings>>('hosts') || {};
                      const hostSettings = hostsConfig[hostName] || {};
                      if (dashboardPanel) {
                          dashboardPanel.webview.postMessage({
                              command: 'hostSettingsResponse',
                              host: hostName,
                              hostType: message.hostType,
                              currentIcon: hostSettings.icon || '',
                              currentColor: hostSettings.color || ''
                          });
                      }
                      return;
                  case 'updateHostIcon':
                      const updateHostName = message.host;
                      const updateConfig = vscode.workspace.getConfiguration('daSSHboard');
                      const updateHostsConfig = updateConfig.get<Record<string, HostSettings>>('hosts') || {};
                      if (!updateHostsConfig[updateHostName]) {
                          updateHostsConfig[updateHostName] = {};
                      }
                      updateHostsConfig[updateHostName].icon = message.icon;
                      updateHostsConfig[updateHostName].color = message.color;
                      updateConfig.update('hosts', updateHostsConfig, vscode.ConfigurationTarget.Global).then(async () => {
                          // Check for new hosts before reloading
                          await generateDefaultHostSettings();
                          // Reload the webview to apply the new icon and color
                          if (dashboardPanel) {
                              const hosts = await getAllHosts();
                              dashboardPanel.webview.html = getWebviewContent(hosts, context.extensionUri, dashboardPanel.webview);
                          }
                      });
                      return;
              }
          },
          undefined,
          context.subscriptions
      );
  });

  context.subscriptions.push(showDashboardDisposable);

  // Diagnostic command to check extension installation and detection
  const checkWslDisposable = vscode.commands.registerCommand('dasshboard.checkWslExtension', async () => {
      const allExtensions = vscode.extensions.all
          .filter(ext => ext.id.toLowerCase().includes('wsl') || 
                        ext.id.toLowerCase().includes('remote') || 
                        ext.id.toLowerCase().includes('docker') ||
                        ext.id.toLowerCase().includes('container'))
          .map(ext => ext.id);
      
      const isWindows = os.platform() === 'win32';
      const wslExtInstalled = isWslExtensionInstalled();
      const dockerExtInstalled = isDockerExtensionInstalled();
      const remoteName = vscode.env.remoteName || 'local';

      let message = `Platform: ${os.platform()}\n`;
      message += `Is Windows: ${isWindows}\n`;
      message += `Current Context: ${remoteName}\n`;
      message += `WSL Extension Detected: ${wslExtInstalled}\n`;
      message += `Docker/Container Extension Detected: ${dockerExtInstalled}\n`;
      message += `\nRelevant Extensions Found:\n${allExtensions.join('\n')}`;

      // Try to get all hosts
      try {
          const allHosts = await getAllHosts();
          message += `\n\nSSH Hosts Found: ${allHosts.ssh.length}`;
          if (allHosts.ssh.length > 0) {
              message += `\nHosts: ${allHosts.ssh.map(d => d.name).join(', ')}`;
          }

          message += `\n\nWSL Distros Found: ${allHosts.wsl.length}`;
          if (allHosts.wsl.length > 0) {
              message += `\nDistros: ${allHosts.wsl.map(d => d.name).join(', ')}`;
          }

          message += `\n\nDocker Containers Found: ${allHosts.docker.length}`;
          if (allHosts.docker.length > 0) {
              message += `\nContainers: ${allHosts.docker.map(d => d.name).join(', ')}`;
          }
      } catch (error) {
          message += `\n\nError getting hosts: ${error}`;
      }
// 
      vscode.window.showInformationMessage(message);
  });

  context.subscriptions.push(checkWslDisposable);

  // Command to open a specific folder remotely for a given host alias (SSH, WSL, or Docker).
  const openFolderDisposable = vscode.commands.registerCommand('dasshboard.openFolder', (host: string, folder: string, newWindow: boolean = false, hostType: 'ssh' | 'wsl' | 'docker' = 'ssh') => {
      console.log(`DaSSHboard: openFolder command called - Type: ${hostType}, Host length: ${host?.length}, Folder: ${folder}`);
      
      // Construct the appropriate remote URI based on the host type
      let remoteUri: vscode.Uri;
      
      if (hostType === 'wsl') {
          // For WSL: vscode-remote://wsl+<distro>/path
          remoteUri = vscode.Uri.parse(`vscode-remote://wsl+${host}${folder}`);
      } else if (hostType === 'docker') {
          // For Docker: vscode-remote://attached-container+<hexEncodedJSON>/<path>
          // VS Code remote extension expects hex-encoded JSON with containerName
          // The host parameter contains the container name
          
          console.log(`DaSSHboard: Container name: ${host}`);
          console.log(`DaSSHboard: Folder: ${folder}`);
          
          // Create JSON object with containerName
          // Format: {"containerName":"container_name"}
          const containerJson = JSON.stringify({ containerName: host });
          
          // Hex-encode the JSON string
          const hexEncoded = Buffer.from(containerJson, 'utf8').toString('hex');
          
          console.log(`DaSSHboard: Container JSON: ${containerJson}`);
          console.log(`DaSSHboard: Hex-encoded: ${hexEncoded}`);
          
          // Normalize the folder path
          // For root path, use empty string to avoid // issues when VS Code opens terminals
          // VS Code's terminal opening mechanism may append paths, causing // if we use /
          let normalizedPath = (folder || '/').trim();
          
          // For root, use empty string (VS Code will interpret this as root)
          // This prevents // when VS Code constructs terminal URIs
          if (normalizedPath === '/' || normalizedPath === '') {
              normalizedPath = '';
          } else {
              // Ensure path starts with / (but not //)
              if (!normalizedPath.startsWith('/')) {
                  normalizedPath = '/' + normalizedPath;
              }
              // Remove any double slashes (but keep the leading single slash)
              normalizedPath = normalizedPath.replace(/\/\//g, '/');
          }
          
          console.log(`DaSSHboard: Normalized path: "${normalizedPath}" (empty for root)`);
          
          // Construct URI string directly - ensure exactly one / after authority
          // Format: vscode-remote://attached-container+<hexEncodedJSON>/<path>
          // For root (empty path), the URI should end with / after authority
          const uriString = normalizedPath === '' 
              ? `vscode-remote://attached-container+${hexEncoded}/`
              : `vscode-remote://attached-container+${hexEncoded}${normalizedPath}`;
          
          console.log(`DaSSHboard: URI string: ${uriString}`);
          
          try {
              // Parse the URI string - this ensures proper formatting
              remoteUri = vscode.Uri.parse(uriString);
              
              console.log(`DaSSHboard: Constructed URI: ${remoteUri.toString()}`);
              console.log(`DaSSHboard: URI scheme: ${remoteUri.scheme}, authority: ${remoteUri.authority}, path: "${remoteUri.path}"`);
              
              // Verify authority is preserved (critical for terminal opening)
              if (!remoteUri.authority || !remoteUri.authority.startsWith('attached-container+')) {
                  console.error(`DaSSHboard: ERROR - Authority not preserved: "${remoteUri.authority}"`);
                  vscode.window.showErrorMessage(`Failed to construct container URI: Authority not preserved`);
                  return;
              }
              
              // Verify path doesn't start with // (this would cause terminal errors)
              if (remoteUri.path && remoteUri.path.startsWith('//')) {
                  console.error(`DaSSHboard: ERROR - Path starts with //: "${remoteUri.path}"`);
                  // Reconstruct with single slash
                  const fixedUriString = uriString.replace(/\/\//g, '/');
                  remoteUri = vscode.Uri.parse(fixedUriString);
                  console.log(`DaSSHboard: Fixed URI: ${remoteUri.toString()}`);
              }
          } catch (error) {
              console.error(`DaSSHboard: Error constructing URI:`, error);
              vscode.window.showErrorMessage(`Failed to construct container URI: ${error}`);
              return;
          }
      } else {
          // For SSH: vscode-remote://ssh-remote+<host>/path
          remoteUri = vscode.Uri.parse(`vscode-remote://ssh-remote+${host}${folder}`);
      }
      
      console.log(`DaSSHboard: Opening ${hostType} connection - URI: ${remoteUri.toString()}`);
      
      // Pass the newWindow parameter to determine whether to open in current window or new window
      vscode.commands.executeCommand('vscode.openFolder', remoteUri, newWindow);
  });

  context.subscriptions.push(openFolderDisposable);
}

/**
* This method is called when your extension is deactivated.
*/
export function deactivate() {}
