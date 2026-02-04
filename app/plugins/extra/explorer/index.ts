import { Folder } from 'lucide-react-native';
import { registerPlugin } from '../../registry';
import { ExplorerAPI } from '../../gpi';
import ExplorerPanel from './Panel';

// Explorer plugin API implementation
const explorerApi = (): ExplorerAPI => ({
  list: async (path: string) => {
    // TODO: Implement with real file system
    return [];
  },
  create: async (path: string, type: 'file' | 'folder') => {
    console.log('Creating:', type, 'at', path);
  },
  rename: async (from: string, to: string) => {
    console.log('Renaming:', from, 'to', to);
  },
  delete: async (path: string) => {
    console.log('Deleting:', path);
  },
  search: async (query: string, opts?: { regex?: boolean; glob?: string }) => {
    console.log('Searching:', query, opts);
    return [];
  },
});

// Register the explorer plugin
registerPlugin({
  id: 'explorer',
  name: 'Explorer',
  type: 'extra',
  icon: Folder,
  component: ExplorerPanel,
  defaultTitle: 'Explorer',
  allowMultipleInstances: true,
  api: explorerApi,
});

export { ExplorerPanel };
