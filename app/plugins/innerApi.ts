// Inner API for app-level imperative updates
// This allows components to refresh without reactive subscriptions

type RefreshCallback = () => void;

class InnerApi {
  private bottomBarRefresh: RefreshCallback | null = null;

  // Register the bottom bar's refresh function
  registerBottomBar(refresh: RefreshCallback) {
    this.bottomBarRefresh = refresh;
  }

  // Unregister when component unmounts
  unregisterBottomBar() {
    this.bottomBarRefresh = null;
  }

  // Call this to refresh the bottom bar
  refreshBottomBar() {
    this.bottomBarRefresh?.();
  }
}

// Singleton instance
export const innerApi = new InnerApi();

// Global access for convenience
if (typeof global !== 'undefined') {
  (global as any).app = (global as any).app || {};
  (global as any).app.innerApi = innerApi;
}
