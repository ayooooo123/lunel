import { CodeXml } from 'lucide-react-native';
import { registerPlugin } from '../../registry';
import { EditorAPI } from '../../gpi';
import EditorPanel from './Panel';

// Editor plugin API implementation
const editorApi = (): EditorAPI => ({
  getOpenFiles: async () => {
    // TODO: Implement when connected to real file system
    return [];
  },
  openFile: async (path: string) => {
    // TODO: Implement
    console.log('Opening file:', path);
  },
  getCurrentFile: async () => {
    // TODO: Implement
    return null;
  },
  insertText: async (text: string) => {
    // TODO: Implement
    console.log('Inserting text:', text);
  },
  getSelection: async () => {
    // TODO: Implement
    return null;
  },
  getFileTree: async () => {
    // TODO: Implement
    return [];
  },
});

// Register the editor plugin
registerPlugin({
  id: 'editor',
  name: 'Editor',
  type: 'core',
  icon: CodeXml,
  component: EditorPanel,
  defaultTitle: 'Editor',
  allowMultipleInstances: false,
  api: editorApi,
});

export { EditorPanel };
