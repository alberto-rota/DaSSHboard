/**
 * Generates default settings for all hosts in the SSH config.
 * This ensures that all hosts are pre-populated in the settings.
 */
async function generateDefaultHostSettings() {
  try {
      // Get all hosts from SSH config
      const hosts = await getSshHosts();
      
      // Get current settings
      const config = vscode.workspace.getConfiguration('daSSHboard');
      let hostsConfig = config.get<Record<string, HostSettings>>('hosts') || {};
      let settingsUpdated = false;
      
      // Create default settings for each host if not already present
      for (const host of hosts) {
          if (!hostsConfig[host.name]) {
              // Default folder based on user if available
              const defaultFolder = host.user ? `/home/${host.user}` : '/home';
              
              hostsConfig[host.name] = {
                  folders: [defaultFolder],
                  color: '',  // Empty but present
                  icon: ''    // Empty but present
              };
              
              settingsUpdated = true;
          }
      }
      
      // Update the configuration if changes were made
      if (settingsUpdated) {
          await config.update('hosts', hostsConfig, vscode.ConfigurationTarget.Global);
      }
  } catch (error) {
      console.error('Error generating default host settings:', error);
  }
}
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as dns from 'dns';

// Interface for host settings
interface HostSettings {
  folders?: string[];
  color?: string;
  icon?: string;
}

// Interface for host configuration with IP
interface HostConfig {
  name: string;          // The SSH Host name/alias (e.g., "Orion", "ASXCVM")
  hostname: string;      // The actual hostname/IP (e.g., "34.171.91.187")
  user?: string;         // The username for the connection
  ip?: string;           // Resolved IP address (if different from hostname)
  settings: HostSettings;
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
                          settings: getHostSettings(currentHost)
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
* Generates the HTML content for the custom welcome dashboard webview.
* It takes an array of SSH host configs and creates a grid of host cards
* with options to open different folders in current window or new window.
*/
function getWebviewContent(hosts: HostConfig[], extensionUri: vscode.Uri, webview: vscode.Webview): string {
  let hostCards = '';
  if (hosts.length === 0) {
      hostCards = `<p class="no-hosts">No SSH hosts found in your ~/.ssh/config file.</p>`;
  } else {
      for (const host of hosts) {
          // Create paths to the icons
          const currentWindowIconPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'current-window.svg'));
          const newWindowIconPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'new-window.svg'));
          
          // Custom icon color style and classes for SVG coloring
          let iconColorStyle = '';
          let actionButtonClass = '';
          
          if (host.settings.color) {
              // Custom color provided in settings - only apply to icons, not background
              iconColorStyle = `style="color: ${host.settings.color}; --host-color: ${host.settings.color}; --host-color-hue: ${getHue(host.settings.color)};"`;
              actionButtonClass = 'host-colored';
          } else {
              // No custom color - use default text link color for icons
              actionButtonClass = 'default-colored';
          }
          
          // Custom host icon if specified
          let hostIconHtml = '';
          if (host.settings.icon) {
              // Add .svg extension if not already present
              let iconFileName = host.settings.icon;
              if (!iconFileName.toLowerCase().endsWith('.svg')) {
                  iconFileName += '.svg';
              }
              
              const hostIconPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'hosts', iconFileName));
              const iconClass = host.settings.color ? 'custom-colored-svg' : 'default-colored-svg';
              hostIconHtml = `<img src="${hostIconPath}" class="host-icon ${iconClass}" ${host.settings.color ? iconColorStyle : ''} alt="${host.name} icon" />`;
          }
          
          // Display user@hostname if user is available
          const connectionDetail = host.user 
              ? `${host.user}@${host.hostname}` 
              : host.hostname;
          
          // Get folders (default to /home if none specified)
          const folders = host.settings.folders && host.settings.folders.length > 0 
              ? host.settings.folders 
              : [host.user === "root" ? "/root" : `/home/${host.user}`];
          
          // Create folder entries
          let folderEntries = '';
          for (const folder of folders) {
              folderEntries += `
              <div class="folder-entry">
                  <span class="folder-path">${folder}</span>
                  <div class="folder-actions">
                      <button class="action-button ${actionButtonClass}" ${host.settings.color ? iconColorStyle : ''} onclick="openFolder('${host.name}', '${folder}', false)">
                          <img src="${currentWindowIconPath}" width="30" height="20" alt="Current window">
                          <span class="tooltip">Open in current window</span>
                      </button>
                      <button class="action-button ${actionButtonClass}" ${host.settings.color ? iconColorStyle : ''} onclick="openFolder('${host.name}', '${folder}', true)">
                          <img src="${newWindowIconPath}" width="30" height="20" alt="New window">
                          <span class="tooltip">Open in new window</span>
                      </button>
                  </div>
              </div>`;
          }
          
          hostCards += `
          <div class="host-card">
              <div class="host-header" ${host.settings.color ? iconColorStyle : ''}>
                  ${hostIconHtml}
                  <h2>${host.name}</h2>
                  <span class="host-connection">${connectionDetail}</span>
              </div>
              <div class="folders-container">
                  ${folderEntries}
              </div>
          </div>`;
      }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DaSSHboard</title>
<style>
  body {
    background-color: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    font-family: "Segoe UI", sans-serif;
    padding: 20px;
    margin: 0;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin: 20px 0;
  }

  .host-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 30px;
    max-width: 1200px;
    width: 90%;
    justify-content: center;
    perspective: 1000px;
  }

  .host-card {
    background-color: var(--vscode-sideBar-background);
    color: var(--vscode-editor-foreground);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px var(--vscode-widget-shadow);
    transition: border-color 0.3s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    border: 1px solid transparent;
  }

  .host-card:hover {
    background-color: var(--vscode-list-hoverBackground);
    border-color: var(--host-color), rgba(0, 120, 212, 0.4));
  }

  .host-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    position: relative;
  }
  
  .host-icon {
    width: 20px;
    height: 20px;
    margin-right: 8px;
  }
  
  /* Custom colored SVG styling */
  .custom-colored-svg {
    filter: brightness(0) saturate(100%); /* First make it black */
    filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(calc(var(--host-color-hue) * 1deg)) brightness(104%) contrast(97%);
  }
  
  /* Default colored SVG styling - uses the same color as heading */
  .default-colored-svg {
    filter: brightness(0) saturate(100%) invert(50%) sepia(40%) saturate(1000%) hue-rotate(175deg) brightness(100%) contrast(95%);
    /* This filter approximates the VSCode link color - will be overridden by the theme */
    color: var(--vscode-textLink-foreground);
  }
  
  /* Style for action buttons that inherit host color */
  .action-button.host-colored {
    color: var(--host-color);
  }

  .action-button.host-colored img {
    filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(calc(var(--host-color-hue) * 1deg)) brightness(104%) contrast(97%);
  }
  
  /* Style for action buttons that use default color */
  .action-button.default-colored img {
    filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(calc(var(--vscode-textLink-foreground) * 1deg)) brightness(104%) contrast(97%);
    /* This filter approximates the VSCode link color - will be overridden by the theme */
  }

  .host-card h2 {
    color: var(--vscode-textLink-foreground);
    margin: 0;
    flex-grow: 1;
  }
  
  .host-connection {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    margin-left: 10px;
    white-space: nowrap;
  }
  
  .folders-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 16px;
  }
  
  .folder-entry {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    background-color: var(--vscode-editor-background);
    border-radius: 4px;
  }
  
  .folder-path {
    font-family: monospace;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .folder-actions {
    display: flex;
    gap: 5px;
  }

  .action-button {
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    padding: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 48px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .action-button:hover {
    background-color: var(--vscode-button-hoverBackground);
  }
  
  .tooltip {
    visibility: hidden;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    text-align: center;
    padding: 5px 8px;
    border-radius: 4px;
    white-space: nowrap;
    font-size: 11px;
    margin-bottom: 5px;
    border: 1px solid var(--vscode-editorWidget-border);
    z-index: 1;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .action-button:hover .tooltip {
    visibility: visible;
    opacity: 1;
  }
  
  .no-hosts {
    text-align: center;
    grid-column: 1 / -1;
  }
  
  footer {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px 0;
    width: 100%;
  }
  
  .config-button {
    background-color: var(--vscode-button-secondaryBackground, var(--vscode-button-background));
    color: var(--vscode-button-secondaryForeground, var(--vscode-button-foreground));
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .config-button:hover {
    background-color: var(--vscode-button-secondaryHoverBackground, var(--vscode-button-hoverBackground));
  }
</style>
</head>
<body>
<div class="container">
  <div class="host-grid">
    ${hostCards}
  </div>
</div>
<footer align-items: center>
  <button class="config-button" onclick="openSshConfig()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
    </svg>
    Open SSH Config
  </button>
  <button class="config-button" onclick="openDaSSHboardSetting()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
    </svg>
    Open DaSSHboard settings
  </button>
</footer>
<script>
  const vscode = acquireVsCodeApi();
  
  function openFolder(host, folder, newWindow) {
      vscode.postMessage({
          command: 'openFolder',
          host: host,
          folder: folder,
          newWindow: newWindow
      });
  }
  
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
</script>
</body>
</html>`;
}


/**
* This method is called when your extension is activated.
*/
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "dasshboard" is now active!');
  generateDefaultHostSettings().catch(error => {
      console.error('Error during settings initialization:', error);
  });
  // Command to show the custom welcome dashboard
  const showDashboardDisposable = vscode.commands.registerCommand('dasshboard.showDashboard', async () => {
      const panel = vscode.window.createWebviewPanel(
          'dasshboard',           // Identifies the type of the webview.
          'Remote SSH Welcome',          // Title of the panel.
          vscode.ViewColumn.One,         // Editor column to show the new webview panel in.
          {
              enableScripts: true,       // Enable JavaScript in the webview
              localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')] // Allow access to the media folder
          }
      );

      const hosts = await getSshHosts();
      panel.webview.html = getWebviewContent(hosts, context.extensionUri, panel.webview);

      // Listen for messages from the webview.
      panel.webview.onDidReceiveMessage(
          message => {
              switch (message.command) {
                  case 'openFolder':
                      vscode.commands.executeCommand('dasshboard.openFolder', 
                          message.host, 
                          message.folder, 
                          message.newWindow);
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
              }
          },
          undefined,
          context.subscriptions
      );
  });

  context.subscriptions.push(showDashboardDisposable);

  // Command to open a specific folder remotely for a given host alias.
  const openFolderDisposable = vscode.commands.registerCommand('dasshboard.openFolder', (host: string, folder: string, newWindow: boolean = false) => {
      // Construct a remote URI of the form: vscode-remote://ssh-remote+<host>/path
      const remoteUri = vscode.Uri.parse(`vscode-remote://ssh-remote+${host}${folder}`);
      // Pass the newWindow parameter to determine whether to open in current window or new window
      vscode.commands.executeCommand('vscode.openFolder', remoteUri, newWindow);
  });

  context.subscriptions.push(openFolderDisposable);
}

/**
* This method is called when your extension is deactivated.
*/
export function deactivate() {}