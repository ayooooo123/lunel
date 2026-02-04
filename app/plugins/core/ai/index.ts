import { Sparkles } from 'lucide-react-native';
import { registerPlugin } from '../../registry';
import { AIAPI } from '../../gpi';
import AIPanel from './Panel';

// AI plugin API implementation
const aiApi = (): AIAPI => ({
  sendMessage: async (message: string) => {
    // TODO: Implement when connected to AI backend
    console.log('Sending message to AI:', message);
    return 'AI response placeholder';
  },
  clearChat: async () => {
    // TODO: Implement
    console.log('Clearing chat');
  },
});

// Register the AI plugin
registerPlugin({
  id: 'ai',
  name: 'AI',
  type: 'core',
  icon: Sparkles,
  component: AIPanel,
  defaultTitle: 'AI',
  allowMultipleInstances: false,
  api: aiApi,
});

export { AIPanel };
