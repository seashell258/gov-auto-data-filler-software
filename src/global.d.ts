export {};

declare global {
  interface Window {
    electronAPI: {
      fillFormA: (data: [string, number][]) => void;
    };
  }
}
