# DaSSHboard 🚀

[![Version](https://img.shields.io/visual-studio-marketplace/v/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)

## Supercharge Your Remote Development Workflow

DaSSHboard is a stylish, intuitive dashboard for VS Code that puts your SSH connections at your fingertips. Never waste time typing SSH commands or hunting for host details again!

[IMAGE: Dashboard overview screenshot]

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

[IMAGE: Quick connection demonstration]

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

DaSSHboard includes several built-in icons for your connections:

[IMAGE: Icon gallery]

## 🔍 Commands

- **Show DaSSHboard**: Open the dashboard manually (Command Palette > "Show DaSSHboard")

## 🤝 Contributing

Found a bug or have a feature request? Open an issue on [GitHub](https://github.com/alberto-rota/DaSSHboard)!

## 📄 License

GPLv3

---

Enjoy a smoother, more colorful remote development experience with DaSSHboard! ✨
