// extension.ts

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Reads the default SSH config file (~/.ssh/config) and extracts host aliases.
 */
function getSshHosts(): string[] {
    const configPath = path.join(os.homedir(), '.ssh', 'config');
    if (!fs.existsSync(configPath)) {
        return [];
    }
    const content = fs.readFileSync(configPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const hosts: string[] = [];
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.toLowerCase().startsWith("host ")) {
            // The "Host" line might contain multiple aliases.
            const parts = trimmedLine.split(/\s+/);
            // Skip the first element which is "Host"
            for (let i = 1; i < parts.length; i++) {
                const alias = parts[i].trim();
                // Skip wildcard entries and duplicates.
                if (alias && alias !== '*' && !hosts.includes(alias)) {
                    hosts.push(alias);
                }
            }
        }
    }
    return hosts;
}

/**
 * Generates the HTML content for the custom welcome dashboard webview.
 * It takes an array of SSH host aliases and creates a list of buttons.
 */
function getWebviewContent(hosts: string[]): string {
    let hostButtons = '';
    if (hosts.length === 0) {
        hostButtons = `<p>No SSH hosts found in your ~/.ssh/config file.</p>`;
    } else {
        for (const host of hosts) {
            hostButtons += `
            <div class="host-card" onclick="openHome('${host}')">
                <h2>${host}</h2>
                <p>Open <code>/home</code> on ${host}</p>
            </div>`;
        }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Remote SSH Welcome</title>
  <style>
  body {
    background-color: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    font-family: "Segoe UI", sans-serif;
    padding: 20px;
  }

  .host-card {
    background-color: var(--vscode-sideBar-background);
    color: var(--vscode-editor-foreground);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px var(--vscode-widget-shadow);
    transition: transform 0.2s ease;
    cursor: pointer;
  }

  .host-card:hover {
    background-color: var(--vscode-list-hoverBackground);
    transform: scale(1.02);
  }

  .host-card h2 {
    color: var(--vscode-textLink-foreground);
  }

  code {
    color: var(--vscode-editorCodeLens-foreground);
  }
</style>

</head>
<body>
  <header>
    <h1>Remote SSH Dashboard</h1>
    <p>Select a host to open its <code>/home</code> directory remotely</p>
  </header>
  <div class="container">
    <div class="host-grid">
      ${hostButtons}
    </div>
  </div>
  <footer>
    <p>RemoteSSHWelcome Extension</p>
  </footer>
  <script>
    const vscode = acquireVsCodeApi();
    function openHome(host) {
        vscode.postMessage({
            command: 'openHome',
            text: host
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
    console.log('Congratulations, your extension "remotesshwelcome" is now active!');

    // Command to show the custom welcome dashboard
    const showDashboardDisposable = vscode.commands.registerCommand('remotesshwelcome.showDashboard', () => {
        const panel = vscode.window.createWebviewPanel(
            'remotesshwelcome',        // Identifies the type of the webview.
            'Remote SSH Welcome',       // Title of the panel.
            vscode.ViewColumn.One,      // Editor column to show the new webview panel in.
            {
                enableScripts: true    // Enable JavaScript in the webview
            }
        );

        const hosts = getSshHosts();
        panel.webview.html = getWebviewContent(hosts);

        // Listen for messages from the webview.
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'openHome':
                        vscode.commands.executeCommand('remotesshwelcome.openHome', message.text);
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(showDashboardDisposable);

    // Command to open the /home directory remotely for a given host alias.
    const openHomeDisposable = vscode.commands.registerCommand('remotesshwelcome.openHome', (host: string) => {
        // Construct a remote URI of the form: vscode-remote://ssh-remote+<host>/home
        const remoteUri = vscode.Uri.parse(`vscode-remote://ssh-remote+${host}/home`);
        // The second parameter (false) indicates to not force a new window.
        vscode.commands.executeCommand('vscode.openFolder', remoteUri, false);
    });

    context.subscriptions.push(openHomeDisposable);
}

/**
 * This method is called when your extension is deactivated.
 */
export function deactivate() {}
