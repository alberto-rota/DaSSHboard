# DaSSHboard 🚀

[![Version](https://img.shields.io/visual-studio-marketplace/v/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)

## Supercharge Your Remote Development Workflow

DaSSHboard is a stylish, intuitive dashboard for VS Code that puts your SSH connections at your fingertips. Never waste time typing SSH commands or hunting for host details again!

![Overview](overview.png)

## ✨ Features

- **Smart Auto-discovery**: Automatically detects all hosts from your SSH config
- **One-Click Connections**: Connect to any SSH host with a single click
- **Beautiful Interface**: Customizable colors and icons for each connection
- **Multiple Folders**: Open multiple remote folders per host
- **Startup Integration**: Launch automatically when VS Code starts

## 🔧 Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "DaSSHboard"
4. Click Install

## 🚀 Quick Start

1. Install the extension
2. Open VS Code - DaSSHboard will appear automatically (or run the "Show DaSSHboard" command)
3. Click on any host to connect!

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

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 20px; margin: 20px 0;">
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/analytics_white.png">
      <img src="media/readme/analytics.png" width="32" height="32" alt="Analytics icon">
    </picture>
    <div>analytics</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/apple_white.png">
      <img src="media/readme/apple.png" width="32" height="32" alt="Apple icon">
    </picture>
    <div>apple</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/aws_white.png">
      <img src="media/readme/aws.png" width="32" height="32" alt="AWS icon">
    </picture>
    <div>aws</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/azure_white.png">
      <img src="media/readme/azure.png" width="32" height="32" alt="Azure icon">
    </picture>
    <div>azure</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/backup_white.png">
      <img src="media/readme/backup.png" width="32" height="32" alt="Backup icon">
    </picture>
    <div>backup</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/cicd_white.png">
      <img src="media/readme/cicd.png" width="32" height="32" alt="CI/CD icon">
    </picture>
    <div>cicd</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/code_white.png">
      <img src="media/readme/code.png" width="32" height="32" alt="Code icon">
    </picture>
    <div>code</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/database_white.png">
      <img src="media/readme/database.png" width="32" height="32" alt="Database icon">
    </picture>
    <div>database</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/desktop_white.png">
      <img src="media/readme/desktop.png" width="32" height="32" alt="Desktop icon">
    </picture>
    <div>desktop</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/docker_white.png">
      <img src="media/readme/docker.png" width="32" height="32" alt="Docker icon">
    </picture>
    <div>docker</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/files_white.png">
      <img src="media/readme/files.png" width="32" height="32" alt="Files icon">
    </picture>
    <div>files</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/folder_white.png">
      <img src="media/readme/folder.png" width="32" height="32" alt="Folder icon">
    </picture>
    <div>folder</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/git_white.png">
      <img src="media/readme/git.png" width="32" height="32" alt="Git icon">
    </picture>
    <div>git</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/google_white.png">
      <img src="media/readme/google.png" width="32" height="32" alt="Google icon">
    </picture>
    <div>google</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/home_white.png">
      <img src="media/readme/home.png" width="32" height="32" alt="Home icon">
    </picture>
    <div>home</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/iot_white.png">
      <img src="media/readme/iot.png" width="32" height="32" alt="IoT icon">
    </picture>
    <div>iot</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/kubernetes_white.png">
      <img src="media/readme/kubernetes.png" width="32" height="32" alt="Kubernetes icon">
    </picture>
    <div>kubernetes</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/laptop_white.png">
      <img src="media/readme/laptop.png" width="32" height="32" alt="Laptop icon">
    </picture>
    <div>laptop</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/linux_white.png">
      <img src="media/readme/linux.png" width="32" height="32" alt="Linux icon">
    </picture>
    <div>linux</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/office_white.png">
      <img src="media/readme/office.png" width="32" height="32" alt="Office icon">
    </picture>
    <div>office</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/proxy_white.png">
      <img src="media/readme/proxy.png" width="32" height="32" alt="Proxy icon">
    </picture>
    <div>proxy</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/raspberry_white.png">
      <img src="media/readme/raspberry.png" width="32" height="32" alt="Raspberry Pi icon">
    </picture>
    <div>raspberry</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/security_white.png">
      <img src="media/readme/security.png" width="32" height="32" alt="Security icon">
    </picture>
    <div>security</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/server_white.png">
      <img src="media/readme/server.png" width="32" height="32" alt="Server icon">
    </picture>
    <div>server</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/test_white.png">
      <img src="media/readme/test.png" width="32" height="32" alt="Test icon">
    </picture>
    <div>test</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/web_white.png">
      <img src="media/readme/web.png" width="32" height="32" alt="Web icon">
    </picture>
    <div>web</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/windows_white.png">
      <img src="media/readme/windows.png" width="32" height="32" alt="Windows icon">
    </picture>
    <div>windows</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/readme/gcp_white.png">
      <img src="media/readme/gcp.png" width="32" height="32" alt="GCP icon">
    </picture>
    <div>gcp</div>
  </div>
</div>


## 🤝 Contributing

Found a bug or have a feature request? Open an issue on [GitHub](https://github.com/alberto-rota/DaSSHboard)!

## 📄 License

GPLv3

---

Enjoy a smoother, more colorful remote development experience with DaSSHboard! ✨
