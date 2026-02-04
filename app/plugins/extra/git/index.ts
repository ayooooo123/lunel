import { GitBranch } from 'lucide-react-native';
import { registerPlugin } from '../../registry';
import { GitAPI } from '../../gpi';
import GitPanel from './Panel';

// Git plugin API implementation
const gitApi = (): GitAPI => ({
  status: async () => {
    // TODO: Implement with real git
    return { staged: [], unstaged: [], untracked: [] };
  },
  stage: async (files: string[]) => {
    console.log('Staging files:', files);
  },
  unstage: async (files: string[]) => {
    console.log('Unstaging files:', files);
  },
  commit: async (message: string) => {
    console.log('Committing:', message);
    return 'abc1234'; // mock commit hash
  },
  diff: async (file?: string) => {
    console.log('Getting diff for:', file);
    return '';
  },
  checkout: async (branch: string) => {
    console.log('Checking out:', branch);
  },
  pull: async () => {
    console.log('Pulling');
  },
  push: async () => {
    console.log('Pushing');
  },
});

// Register the git plugin
registerPlugin({
  id: 'git',
  name: 'Git',
  type: 'extra',
  icon: GitBranch,
  component: GitPanel,
  defaultTitle: 'Git',
  allowMultipleInstances: true,
  api: gitApi,
});

export { GitPanel };
