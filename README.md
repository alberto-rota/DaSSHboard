# DaSSHboard 🚀
[![Version](https://img.shields.io/visual-studio-marketplace/v/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/AlbertoRota.dasshboard)](https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard)

Supercharge Your Remote Development Workflow with One-click access to your remote development machines and environments with a customizable VSCode panel.



DaSSHboard is a stylish, intuitive dashboard for VS Code-based IDEs that puts your remote development enviroments available at your fingetips, only one click away.

Access your <picture><source media="(prefers-color-scheme: dark)" srcset="media/hosts/server_white.svg"><img src="media/hosts/server.svg" width="18" height="18" alt="SSH" style="vertical-align: middle;"></picture> **SSH connections**, <picture><source media="(prefers-color-scheme: dark)" srcset="media/hosts/linux_white.svg"><img src="media/hosts/linux.svg" width="18" height="18" alt="WSL" style="vertical-align: middle;"></picture> **WSL distros**, and <picture><source media="(prefers-color-scheme: dark)" srcset="media/hosts/docker_white.svg"><img src="media/hosts/docker.svg" width="18" height="18" alt="Docker" style="vertical-align: middle;"></picture> **Running Docker containers** — all from one convenient dashboard. 

Never waste time hunting for host details again!

![Overview](overview.png)

---

### 📦 Installation
Search for **`DaSSHboard`** in the Extensions panel (VS Code / Cursor) or on the **VS Code Marketplace**, on Open

You can also download the `.vsix` file from the [latest release](https://github.com/alberto-rota/DaSSHboard/releases/latest) or from **Open-VSX** and drag-and-drop it into the Extensions panel.

<div align="center">
  <span style="margin-right: 20px;">
    <a href="https://marketplace.visualstudio.com/items?itemName=AlbertoRota.dasshboard">
      🔌 Install from Marketplace
    </a>
  </span>
  |   
  <span style="margin-right: 20px;margin-left: 20px;">
    <a href="https://github.com/alberto-rota/DaSSHboard/raw/master/dasshboard-latest.vsix">
      ⬇️ Download Latest Release (.vsix)  
    </a>
  </span>
  |
  <span style="margin-left: 20px;">
    <a href="https://open-vsx.org/extension/AlbertoRota/dasshboard">
      📦 Visit OpenVSX
    </a>
  </span>
</div>

---

## 🚀 Quick Start

1. **Install** the extension.  
2. Hit the **`DaSSHboard button`** (second from the left in the status-bar), use the Remote menu, *or* run **"Show DaSSHboard"** from the Command Palette.  
3. All your remote development environments are now one click away! 
4. Click the <picture><source media="(prefers-color-scheme: dark)" srcset="media/current-window-white.svg"><img src="media/current-window.svg" width="22" alt="Current window" style="vertical-align: middle;"></picture> (open in current window) or <picture><source media="(prefers-color-scheme: dark)" srcset="media/new-window-white.svg"><img src="media/new-window.svg" width="22" alt="New window" style="vertical-align: middle;"></picture> (open in new window) button next to one of the available entrypoint paths on the remote host, and you'll jump straight into that environment!

**Notes:** 
- WSL support is available on Windows systems with the [WSL extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) installed. 
- Docker support is available if the [Container Tools extension](https://open-vsx.org/extension/ms-azuretools/vscode-containers) is installed. 
- ---

## 🛠️ Customization

DaSSHboard reads your existing SSH config (`~/.ssh/config`) to establish which remote SSH hosts you usually connect to, detects WSL distros automatically, and parses `docker ps` to establish which containers are running. 

Default entrypoint paths are chosen as follows:
- For SSH hosts: the home directory of the `User` specified in your `~/.ssh/config`.
- For WSL distros: the default user's home directory for that WSL installation.
- For Docker containers: the root folder (`/`) of the running container.
  
### 🗂️ Layouts
View your host in a grid layout or in a list layout! Change it with the toggle button at the bottom of the view

<div align="left" style="display: flex;">

  <div style="flex: 1; min-width: 240px; max-width: 95%; height:300px">
    <img src="media/readme/gridview.png" alt="Grid layout in DaSSHboard"  style="margin-top: 7px; border-radius: 6px;" />
  </div>

  <div style="flex: 1; min-width: 240px; max-width: 95%; height:300px">
    <img src="media/readme/listview.png" alt="List layout in DaSSHboard"  style="margin-top: 7px;  border-radius: 6px;" />
  </div>

</div>
<br>

### 🎨 Customize each host’s icon and color for easy identification

<div align="left" style="display: flex; flex-wrap: wrap;">

  <div style="flex: 0 0 40%; min-width: 180px; max-width: 40%; display: flex; align-items: center; padding: 10px 0;">
    <div>
      <b>Customize host icons</b><br>
      Differentiate every host and make it immediately recognizable by assigning it its own color and one of the icons among a set of several from <a href="https://lucide.dev/icons/" target="_blank">Lucide</a>'s. 
      <br><br>
      Click on the icon on the top left of th host card and you'll get a customization UI. The set of available icons gets updated frequently!
    </div>
  </div>
  <div style="flex: 0 0 60%; min-width: 200px; max-width: 60%; padding: 10px 0;">
    <img src="media/readme/icon_customization.png" alt="Custom icon picker for hosts" style="border-radius: 6px; width: 98%; max-width: 540px;" />
  </div>
  <div style="flex: 0 0 40%; min-width: 180px; max-width: 40%; display: flex; align-items: center; padding: 18px 0 10px 0;">
    <div>
      <b>Assign section colors</b><br>
      Assign a color to each section (SSH hosts, WSLs and Docker containers). 
    </div>
  </div>
  <div style="flex: 0 0 60%; min-width: 200px; max-width: 60%; padding: 10px 0px;">
    <img src="media/readme/section_customization.png" alt="Custom color selector for section" style="border-radius: 6px; width: 98%; max-width: 540px;" />
  </div>

</div>


**Configure folder paths:**  
You might have remote development environment into more than one folder in a single host. With **DaSSHboard**, all of them will still be one click away! Just click the **`Configure Path Entrypoints`** button at the bottom of the page and add as many entries as you want in the json.

---

## 🤝 Contributing  

Spotted a bug or have a feature idea?  
Open an issue or pull-request on **[GitHub](https://github.com/alberto-rota/DaSSHboard)** – contributions are very welcome!

---

## 📄 License  

**GPL v3**

Enjoy a smoother, more colourful remote-development experience with **DaSSHboard**! ✨
