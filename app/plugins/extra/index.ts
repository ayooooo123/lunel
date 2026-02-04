// Extra plugins - optional plugins that can be added/removed from bottom bar
// Import them to register with the plugin system

import './git';
import './explorer';
import './processes';
import './http';
import './ports';
import './tools';
import './monitor';

export { GitPanel } from './git';
export { ExplorerPanel } from './explorer';
export { ProcessesPanel } from './processes';
export { HttpPanel } from './http';
export { PortsPanel } from './ports';
export { ToolsPanel } from './tools';
export { MonitorPanel } from './monitor';
