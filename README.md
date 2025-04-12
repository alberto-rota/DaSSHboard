# DaSSHboard 🚀

[![Version](https://img.shields.io/visual-studio-marketplace/v/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)

## Supercharge Your Remote Development Workflow

DaSSHboard is a stylish, intuitive dashboard for VS Code that puts your SSH connections at your fingertips. Never waste time typing SSH commands or hunting for host details again!

![Overview](overview.png)

### 📦 Installation
You can search for `DaSSHboard` in the Extensions panel inside **VS Code** or **Cursor**, as well in the **VS Code Marketplace**.

You can also download the `.vsix` file and drag and drop it directly into the extension panel

<div align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard"
     style="
       display: inline-block;
       background: linear-gradient(135deg, #ffa000, #00c7a1);
       color: white;
       padding: 12px 24px;
       text-decoration: none;
       border-radius: 8px;
       font-weight: 600;
       font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
       box-shadow: 0 4px 12px rgba(0,0,0,0.1);
       transition: all 0.3s ease;
     "
     onmouseover="this.style.background='linear-gradient(135deg, #ffa000, #00c7a1)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.15)'"
     onmouseout="this.style.background='linear-gradient(135deg, #ffa000, #00c7a1)'; this.style.transform='none'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
  >
    🔌 Install from Marketplace
  </a>
  <a href="https://github.com/alberto-rota/DaSSHboard/raw/main/dasshboard-latest.vsix"
     style="
       display: inline-block;
       background: linear-gradient(135deg, #fd6875, #007acc);
       color: white;
       padding: 12px 24px;
       text-decoration: none;
       border-radius: 8px;
       font-weight: 600;
       font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
       box-shadow: 0 4px 12px rgba(0,0,0,0.1);
       transition: all 0.3s ease;
     "
     onmouseover="this.style.background='linear-gradient(135deg, #fd6875, #007acc)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.15)'"
     onmouseout="this.style.background='linear-gradient(135deg, #fd6875, #007acc)'; this.style.transform='none'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
  >
    ⬇️ Download Latest Release (.vsix)
  </a>
</div>

---

## ✨ Features

- **Smart Auto-discovery**: Automatically detects all hosts from your SSH config
- **One-Click Connections**: Connect to any SSH host with a single click
- **Beautiful Interface**: Customizable colors and icons for each connection
- **Multiple Folders**: Open multiple remote folders per host
- **Startup Integration**: Launch automatically when VS Code starts

## 🚀 Quick Start

1. Install the extension
2. Open VS Code - DaSSHboard will appear automatically (or run the "Show DaSSHboard" command)
3. Click on any host to connect!

## 📝 Interacting with DaSSHboard

Once installed, DaSSHboard offers an intuitive way to manage your SSH connections:

1. **Dashboard View**: The main interface displays all your SSH hosts in a grid layout
   - Each host appears as a card with custom color and icon
   - For each folder, you'll see two action buttons:
     - 🖥️ Open in current window
     - 🗗 Open in new window

2. **Quick Access**: From the dashboard footer, you can:
   - Open your SSH config file to add or modify hosts
   - Access DaSSHboard settings to customize the extension

3. **Automatic Host Setup**: The extension intelligently sets up each host:
   - Creates default configurations for all hosts in your SSH config
   - Sets default folders based on username (e.g., `/home/username`)
   - Resolves hostnames to IP addresses where possible

4. **Custom Appearance**: Each host can be personalized with:
   - Unique colors that apply to icons and interactive elements
   - Specialized icons that represent the host's purpose (server, database, etc.)

## ⚙️ Configuration

DaSSHboard reads your existing SSH config (`~/.ssh/config`), so you don't need to duplicate any connection information!

Customize via VS Code settings (File > Preferences > Settings):

```json
"daSSHboard.openAtStartup": true,  // Show dashboard when VS Code starts
"daSSHboard.hosts": {
  "my-server": {  // Must match a Host entry in your SSH config
    "folders": ["/home/user", "/var/www"],  // Multiple folders to connect to
    "color": "#2980b9",  // Custom background color
    "icon": "server"     // Custom icon
  }
}
```

### Available Icons

DaSSHboard includes several built-in icons for your connections. The icons automatically adapt to your system theme.

| | | | | | | |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/analytics_white.png"><img src="media/readme/analytics.png" width="32" height="32" alt="Analytics icon"></picture><br>analytics | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/apple_white.png"><img src="media/readme/apple.png" width="32" height="32" alt="Apple icon"></picture><br>apple | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/aws_white.png"><img src="media/readme/aws.png" width="32" height="32" alt="AWS icon"></picture><br>aws | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/azure_white.png"><img src="media/readme/azure.png" width="32" height="32" alt="Azure icon"></picture><br>azure | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/backup_white.png"><img src="media/readme/backup.png" width="32" height="32" alt="Backup icon"></picture><br>backup | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/cicd_white.png"><img src="media/readme/cicd.png" width="32" height="32" alt="CI/CD icon"></picture><br>cicd | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/code_white.png"><img src="media/readme/code.png" width="32" height="32" alt="Code icon"></picture><br>code |
| <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/database_white.png"><img src="media/readme/database.png" width="32" height="32" alt="Database icon"></picture><br>database | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/desktop_white.png"><img src="media/readme/desktop.png" width="32" height="32" alt="Desktop icon"></picture><br>desktop | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/docker_white.png"><img src="media/readme/docker.png" width="32" height="32" alt="Docker icon"></picture><br>docker | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/files_white.png"><img src="media/readme/files.png" width="32" height="32" alt="Files icon"></picture><br>files | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/folder_white.png"><img src="media/readme/folder.png" width="32" height="32" alt="Folder icon"></picture><br>folder | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/git_white.png"><img src="media/readme/git.png" width="32" height="32" alt="Git icon"></picture><br>git | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/google_white.png"><img src="media/readme/google.png" width="32" height="32" alt="Google icon"></picture><br>google |
| <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/home_white.png"><img src="media/readme/home.png" width="32" height="32" alt="Home icon"></picture><br>home | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/iot_white.png"><img src="media/readme/iot.png" width="32" height="32" alt="IoT icon"></picture><br>iot | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/kubernetes_white.png"><img src="media/readme/kubernetes.png" width="32" height="32" alt="Kubernetes icon"></picture><br>kubernetes | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/laptop_white.png"><img src="media/readme/laptop.png" width="32" height="32" alt="Laptop icon"></picture><br>laptop | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/linux_white.png"><img src="media/readme/linux.png" width="32" height="32" alt="Linux icon"></picture><br>linux | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/office_white.png"><img src="media/readme/office.png" width="32" height="32" alt="Office icon"></picture><br>office | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/proxy_white.png"><img src="media/readme/proxy.png" width="32" height="32" alt="Proxy icon"></picture><br>proxy |
| <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/raspberry_white.png"><img src="media/readme/raspberry.png" width="32" height="32" alt="Raspberry Pi icon"></picture><br>raspberry | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/security_white.png"><img src="media/readme/security.png" width="32" height="32" alt="Security icon"></picture><br>security | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/server_white.png"><img src="media/readme/server.png" width="32" height="32" alt="Server icon"></picture><br>server | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/test_white.png"><img src="media/readme/test.png" width="32" height="32" alt="Test icon"></picture><br>test | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/web_white.png"><img src="media/readme/web.png" width="32" height="32" alt="Web icon"></picture><br>web | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/windows_white.png"><img src="media/readme/windows.png" width="32" height="32" alt="Windows icon"></picture><br>windows | <picture><source media="(prefers-color-scheme: dark)" srcset="media/readme/gcp_white.png"><img src="media/readme/gcp.png" width="32" height="32" alt="GCP icon"></picture><br>gcp |

## 🤝 Contributing

Found a bug or have a feature request? Open an issue on [GitHub](https://github.com/alberto-rota/DaSSHboard)!

## 📄 License

GPLv3

---

Enjoy a smoother, more colorful remote development experience with DaSSHboard! ✨