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
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/analytics_white.svg">
      <img src="media/hosts/analytics.svg" width="32" height="32" alt="Analytics icon">
    </picture>
    <div>analytics</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/apple_white.svg">
      <img src="media/hosts/apple.svg" width="32" height="32" alt="Apple icon">
    </picture>
    <div>apple</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/aws_white.svg">
      <img src="media/hosts/aws.svg" width="32" height="32" alt="AWS icon">
    </picture>
    <div>aws</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/azure_white.svg">
      <img src="media/hosts/azure.svg" width="32" height="32" alt="Azure icon">
    </picture>
    <div>azure</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/backup_white.svg">
      <img src="media/hosts/backup.svg" width="32" height="32" alt="Backup icon">
    </picture>
    <div>backup</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/cicd_white.svg">
      <img src="media/hosts/cicd.svg" width="32" height="32" alt="CI/CD icon">
    </picture>
    <div>cicd</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/code_white.svg">
      <img src="media/hosts/code.svg" width="32" height="32" alt="Code icon">
    </picture>
    <div>code</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/database_white.svg">
      <img src="media/hosts/database.svg" width="32" height="32" alt="Database icon">
    </picture>
    <div>database</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/desktop_white.svg">
      <img src="media/hosts/desktop.svg" width="32" height="32" alt="Desktop icon">
    </picture>
    <div>desktop</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/docker_white.svg">
      <img src="media/hosts/docker.svg" width="32" height="32" alt="Docker icon">
    </picture>
    <div>docker</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/files_white.svg">
      <img src="media/hosts/files.svg" width="32" height="32" alt="Files icon">
    </picture>
    <div>files</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/folder_white.svg">
      <img src="media/hosts/folder.svg" width="32" height="32" alt="Folder icon">
    </picture>
    <div>folder</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/git_white.svg">
      <img src="media/hosts/git.svg" width="32" height="32" alt="Git icon">
    </picture>
    <div>git</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/google_white.svg">
      <img src="media/hosts/google.svg" width="32" height="32" alt="Google icon">
    </picture>
    <div>google</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/home_white.svg">
      <img src="media/hosts/home.svg" width="32" height="32" alt="Home icon">
    </picture>
    <div>home</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/iot_white.svg">
      <img src="media/hosts/iot.svg" width="32" height="32" alt="IoT icon">
    </picture>
    <div>iot</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/kubernetes_white.svg">
      <img src="media/hosts/kubernetes.svg" width="32" height="32" alt="Kubernetes icon">
    </picture>
    <div>kubernetes</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/laptop_white.svg">
      <img src="media/hosts/laptop.svg" width="32" height="32" alt="Laptop icon">
    </picture>
    <div>laptop</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/linux_white.svg">
      <img src="media/hosts/linux.svg" width="32" height="32" alt="Linux icon">
    </picture>
    <div>linux</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/office_white.svg">
      <img src="media/hosts/office.svg" width="32" height="32" alt="Office icon">
    </picture>
    <div>office</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/proxy_white.svg">
      <img src="media/hosts/proxy.svg" width="32" height="32" alt="Proxy icon">
    </picture>
    <div>proxy</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/raspberry_white.svg">
      <img src="media/hosts/raspberry.svg" width="32" height="32" alt="Raspberry Pi icon">
    </picture>
    <div>raspberry</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/security_white.svg">
      <img src="media/hosts/security.svg" width="32" height="32" alt="Security icon">
    </picture>
    <div>security</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/server_white.svg">
      <img src="media/hosts/server.svg" width="32" height="32" alt="Server icon">
    </picture>
    <div>server</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/test_white.svg">
      <img src="media/hosts/test.svg" width="32" height="32" alt="Test icon">
    </picture>
    <div>test</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/web_white.svg">
      <img src="media/hosts/web.svg" width="32" height="32" alt="Web icon">
    </picture>
    <div>web</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/windows_white.svg">
      <img src="media/hosts/windows.svg" width="32" height="32" alt="Windows icon">
    </picture>
    <div>windows</div>
  </div>
  <div style="text-align: center;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/hosts/gcp_white.svg">
      <img src="media/hosts/gcp.svg" width="32" height="32" alt="GCP icon">
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
