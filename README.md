# DaSSHboard 🚀

[![Version](https://img.shields.io/visual-studio-marketplace/v/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)

## Supercharge Your Remote Development Workflow

DaSSHboard is a stylish, intuitive dashboard for VS Code that puts your SSH connections and WSL distros at your fingertips.  
Never waste time typing SSH commands or hunting for host details again!

![Overview](overview.png)

---

### 📦 Installation
Search for **`DaSSHboard`** in the Extensions panel (VS Code / Cursor) or on the **VS Code Marketplace**.

You can also download the `.vsix` file and drag-and-drop it into the Extensions panel.

<div align="center">
  <span style="margin-right: 20px;">
    <a href="https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard">
      🔌 Install from Marketplace
    </a>
  </span>
  or   
  <span style="margin-left: 20px;">
    <a href="https://github.com/alberto-rota/DaSSHboard/raw/master/dasshboard-latest.vsix">
      ⬇️ Download Latest Release (.vsix)
    </a>
  </span>
</div>


---

## ✨ Features

| &nbsp; | &nbsp; |
|--------|--------|
| **Smart Auto-discovery** | Detects every host in your `~/.ssh/config` and all WSL distros (Windows). |
| **WSL Support** | Seamlessly connect to WSL distros alongside SSH hosts (requires WSL extension). |
| **Organized Sections** | Separate sections for SSH hosts and WSL distros for easy navigation. |
| **One-Click Connect** | Open any host / distro in the current or a new VS Code window. |
| **Theme-Aware Design** | All colors adapt to your active theme (light, dark, high contrast) for perfect readability. |
| **Visual Distinction** | Clear badges and color-coded borders distinguish SSH hosts from WSL distros. |
| **Status-Bar Shortcut** | A dedicated button sits **right after the Remote indicator**. Icon is user-configurable. |
| **Remote-Aware UI** | Context-aware "Close Connection" button appears when in any remote context (SSH, WSL, or Container) with appropriate color coding. |
| **Remote Menu Integration** | "Show DaSSHboard" is available in the Remote window menu (bottom-left) and the Command Palette. |
| **Beautiful Interface** | Per-host colours and icons – local SVGs **or** any *Lucide* icon (`lucide:server`, `lucide:cloud`, …). |
| **Multiple Folders** | Define as many start-folders as you like for each host or distro. |
| **Startup Integration** | Optionally pop the dashboard open when VS Code starts. |

---

## 🚀 Quick Start

1. **Install** the extension.  
2. Hit the **DaSSHboard button** ![remote](media/readme/dasshboard_button.png) (second from the left in the status-bar),  
   use the Remote menu, *or* run **"Show DaSSHboard"** from the Command Palette.  
3. Click a host or WSL distro → choose the directory you want to open into → you're in!

**Notes:** 
- WSL support is available on Windows systems with the [WSL extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) installed. 
- The dashboard automatically adapts to your theme's colors, ensuring perfect readability whether you use light, dark, or high contrast themes.
- 

---

## ⚙️ Configuration

DaSSHboard reads your existing SSH config (`~/.ssh/config`) and detects WSL distros automatically, so you never duplicate connection info.

### Customizing Through the UI

Most customization happens right in the dashboard:

**Change host icons and colors**: Click any host icon in the dashboard. A picker opens where you can choose from dozens of Lucide icons and pick a color from the palette. Your changes save automatically.

**Change section colors**: Click the color square next to "SSH Remote Hosts" or "WSL Distros" section titles. Pick a color from the palette to customize section headers and badges.

**Configure folder paths**: Click the "Configure dashboard paths" button at the bottom of the dashboard. This opens your settings file where you can edit the `folders` array for each host.

**Other settings**: Use the "Open DaSSHboard settings" button at the bottom to access all settings, including startup behavior and status bar icon.

### Advanced: Editing Settings Directly

For advanced customization, you can edit settings directly in VS Code's settings JSON:

```jsonc
{
  // Open dashboard when VS Code starts
  "daSSHboard.openAtStartup": true,

  // Status bar icon (any Lucide icon name)
  "daSSHboard.statusBarIcon": "dashboard",

  // Section colors (leave empty for theme default)
  "daSSHboard.sshSectionColor": "#2980b9",
  "daSSHboard.wslSectionColor": "#00bcf2",

  // Per-host settings
  "daSSHboard.hosts": {
    "my-server": {
      "folders": ["/home/user", "/var/www"],
      "color": "#2980b9",
      "icon": "lucide:server"
    }
  }
}
```

**Icons**: Use `lucide:iconname` for Lucide icons (e.g., `lucide:server`, `lucide:cloud`). For local SVG icons, place files in the extension's `media/hosts/` folder and reference by filename without `.svg` (e.g., `"server"` for `server.svg`).

**Colors**: Use hex codes (`#2980b9`), RGB (`rgb(41, 128, 185)`), or named colors. Leave empty to use theme defaults.

**Folders**: Add as many paths as needed. If omitted, DaSSHboard uses defaults based on host type.

---

## 🤝 Contributing  

Spotted a bug or have a feature idea?  
Open an issue or pull-request on **[GitHub](https://github.com/alberto-rota/DaSSHboard)** – contributions are very welcome!

---

## 📄 License  

**GPL v3**

Enjoy a smoother, more colourful remote-development experience with **DaSSHboard**! ✨
