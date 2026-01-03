/**
 * Type definitions for mobile-use
 */

export interface TaskConfig {
  bundleId?: string;
  task: string;
  maxSteps: number;
  model?: string;
  successCriteria?: string[];
  constraints?: string[];
  deviceId?: string;
  iosDevice?: IosDeviceConfig;
}

export interface IosDeviceConfig {
  udid: string;
  teamId: string;
  appFile: string;
  driverPort?: number;
}

export interface AgentDecision {
  action:
    | 'tap'
    | 'tapText'
    | 'doubleTap'
    | 'longPress'
    | 'inputText'
    | 'eraseText'
    | 'scroll'
    | 'swipe'
    | 'back'
    | 'hideKeyboard'
    | 'openLink'
    | 'pressKey'
    | 'wait'
    | 'launchApp'
    | 'stopApp'
    | 'done'
    | 'failed';
  params?: AgentParams;
  reasoning: string;
  progress: number;
  needsUserInput?: boolean;
  userInputPrompt?: string;
}

export interface AgentParams {
  x?: number;
  y?: number;
  text?: string;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  key?: string;
  url?: string;
  chars?: number;
  timeout?: number;
  appId?: string;
}

export interface ExecutionResult {
  success: boolean;
  reason: string;
  steps: number;
}

export interface AgentContext {
  stepNumber: number;
  maxSteps: number;
  actionHistory: string[];
  successCriteria?: string[];
  constraints?: string[];
}
