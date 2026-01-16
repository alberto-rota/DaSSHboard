# Change Log

All notable changes to the DaSSHboard extension will be documented in this file.

## [2.1.1] - 2026-01-16

### Fixed
- **WSL Fetch idling**: Issues in fetching the list of available WSL distros will not make the whole extension fail to start . A 3 second timeout has been added. 
- **Icon Hovering effects**: Hovering the host icon to have the UI icon selection appear will not cause any flickering on the hover animation and will not require to double-click

## [2.1.0] - 2026-01-15

### Added
- **Full Docker Container Support**: Docker container functionality is now fully re-enabled and working
- **Grid and List Layouts**: Toggle between grid and list view layouts for better organization
- **Interactive Icon Customization**: Click on any host icon to open a customization UI with Lucide icon picker and color selector
- **Interactive Section Color Customization**: Click the color square next to section titles to customize section colors
- **Section Collapse Configuration**: New settings to control whether sections start collapsed (`daSSHboard.sshSectionCollapsed`, `daSSHboard.wslSectionCollapsed`, `daSSHboard.dockerSectionCollapsed`)
- **Layout Configuration**: New `daSSHboard.layout` setting to set default layout mode (grid or list)
- **Docker Section Color Configuration**: New `daSSHboard.dockerSectionColor` setting for Docker section customization
- Updated README with comprehensive documentation of new features
- New SVG icons for improved visual consistency

### Changed
- Removed many old PNG icon files in favor of SVG icons
- Enhanced CSS styling for better visual hierarchy and customization UI
- Improved extension.ts with better organization and new customization features

### Fixed
- Docker container detection and connection now fully functional

## [2.0.0] - 2026-01-13

### Added
- **Major UI Overhaul**: Complete redesign with new CSS styling system (`dasshboard.css`)
- **Lucide Icons Integration**: Full support for Lucide icons library with `lucide.min.js`
- **Enhanced Theme Awareness**: Improved theme-aware design that adapts to light, dark, and high contrast themes
- **WSL Section Color Configuration**: New `daSSHboard.wslSectionColor` setting for customizing WSL section appearance
- **Status Bar Icon Configuration**: New `daSSHboard.statusBarIcon` setting to customize the status bar button icon (any Lucide icon name)
- **Extension Status Check Command**: New `dasshboard.checkWslExtension` command to check extension and connection status
- Updated keywords to include "wsl", "theme", and "windows subsystem for linux"

### Changed
- Major refactoring of `extension.ts` (1468 lines changed) for better code organization and maintainability
- Updated extension description to emphasize theme-aware design and WSL support
- Enhanced package.json with Lucide dependency and updated build scripts
- Improved package-lock.json structure

### Fixed
- Better integration with WSL extension detection
- Improved startup behavior and extension activation

## [1.11.0] - 2026-01-12

### Added
- **WSL Support**: DaSSHboard now detects and displays all installed WSL distros on Windows systems
- **Docker Support**: DaSSHboard now detects and displays all running Docker containers
- **Organized Sections**: Dashboard is now divided into three separate sections for SSH hosts, WSL distros, and Docker containers
- WSL distros appear with green "WSL" badges
- Docker containers appear with cyan "DOCKER" badges
- Color-coded borders to distinguish connection types (SSH: blue, WSL: green, Docker: cyan)
- Section headers with counts for each category
- Automatic detection of WSL distros when the WSL extension (Microsoft or AnySphere) is installed
- Automatic detection of Docker containers (works with Docker extension, Dev Containers extension, or Cursor's Container Tools)
- Support for opening WSL distros and Docker containers in current or new window
- Docker-specific default folders (/workspaces, /workspace, /app, /root)
- Configuration support for all three connection types in `daSSHboard.hosts` settings
- **Context-aware close buttons**: When opened from within a remote connection, displays appropriate "Close Connection" button with specific text and color for each type (SSH: red, WSL: green, Docker: cyan)

### Changed
- Updated extension description to reflect WSL and Docker support
- Enhanced dashboard UI with separate sections for better organization
- Improved visual hierarchy with section titles and counts
- Updated configuration documentation with WSL and Docker examples
- Default folder logic now adapts based on connection type
- Docker detection now works even without an extension installed (as long as Docker CLI is available)

### Fixed
- **Startup behavior**: Dashboard now properly opens on startup when `openAtStartup` setting is enabled (default: true)
- **Theme-aware colors**: All colors now use VSCode theme variables for perfect readability on any theme (light, dark, high contrast)
- Section titles, badges, borders, and buttons now adapt to the active theme colors
- No more hard-coded colors that might be unreadable on certain themes

### Temporarily Disabled
- Docker container functionality (will be re-enabled in a future update)

## [1.10.0] and earlier

- Previous releases (see git history)