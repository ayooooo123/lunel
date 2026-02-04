import { useCallback, useEffect, useRef } from 'react';
import { useConnection, Message } from '../contexts/ConnectionContext';

export interface TerminalCell {
  char: string;
  fg: string;
  bg: string;
}

export interface TerminalState {
  buffer: TerminalCell[][];
  cursorX: number;
  cursorY: number;
  cols: number;
  rows: number;
}

export interface TerminalEvents {
  onState?: (terminalId: string, state: TerminalState) => void;
  onExit?: (terminalId: string, code: number) => void;
}

export function useTerminal(events?: TerminalEvents) {
  const { sendControl, sendData, onDataEvent, status } = useConnection();
  const eventsRef = useRef(events);

  // Keep events ref updated
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Listen for terminal events from data channel
  useEffect(() => {
    const unsubscribe = onDataEvent((message: Message) => {
      if (message.ns !== 'terminal') return;

      if (message.action === 'state' && eventsRef.current?.onState) {
        eventsRef.current.onState(
          message.payload.terminalId as string,
          {
            buffer: message.payload.buffer as TerminalCell[][],
            cursorX: message.payload.cursorX as number,
            cursorY: message.payload.cursorY as number,
            cols: message.payload.cols as number,
            rows: message.payload.rows as number,
          }
        );
      }

      if (message.action === 'exit' && eventsRef.current?.onExit) {
        eventsRef.current.onExit(
          message.payload.terminalId as string,
          message.payload.code as number
        );
      }
    });

    return unsubscribe;
  }, [onDataEvent]);

  const isConnected = status === 'connected';

  const spawn = useCallback(async (options: {
    shell?: string;
    cols?: number;
    rows?: number;
  } = {}): Promise<string> => {
    const response = await sendControl('terminal', 'spawn', {
      shell: options.shell,
      cols: options.cols ?? 80,
      rows: options.rows ?? 24,
    });
    if (!response.ok) {
      throw new Error(response.error?.message || 'Failed to spawn terminal');
    }
    return response.payload.terminalId as string;
  }, [sendControl]);

  const write = useCallback(async (terminalId: string, data: string): Promise<void> => {
    const response = await sendData('terminal', 'write', { terminalId, data });
    if (!response.ok) {
      throw new Error(response.error?.message || 'Failed to write to terminal');
    }
  }, [sendData]);

  const resize = useCallback(async (terminalId: string, cols: number, rows: number): Promise<void> => {
    const response = await sendControl('terminal', 'resize', { terminalId, cols, rows });
    if (!response.ok) {
      throw new Error(response.error?.message || 'Failed to resize terminal');
    }
  }, [sendControl]);

  const kill = useCallback(async (terminalId: string): Promise<void> => {
    const response = await sendControl('terminal', 'kill', { terminalId });
    if (!response.ok) {
      throw new Error(response.error?.message || 'Failed to kill terminal');
    }
  }, [sendControl]);

  return {
    isConnected,
    spawn,
    write,
    resize,
    kill,
  };
}
