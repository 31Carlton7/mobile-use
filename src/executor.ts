/**
 * TaskExecutor - Orchestrates the AI agent and Maestro client
 */

import ora, { type Ora } from 'ora';
import pc from 'picocolors';
import { MaestroClient } from './maestro.js';
import { TaskAgent } from './agent.js';
import type { TaskConfig, AgentDecision, ExecutionResult } from './types.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSpinner(text: string): Ora {
  return ora({
    text,
    stream: process.stdout,
    isEnabled: true,
    isSilent: false,
  });
}

export class TaskExecutor {
  private maestro: MaestroClient;
  private agent: TaskAgent;
  private config: TaskConfig;

  constructor(config: TaskConfig, apiKey: string) {
    this.config = config;
    this.maestro = new MaestroClient({
      bundleId: config.bundleId,
      deviceId: config.deviceId,
      iosDevice: config.iosDevice,
    });
    this.agent = new TaskAgent(apiKey, config.model);
  }

  async execute(): Promise<ExecutionResult> {
    console.log(pc.cyan('\n🎯 Task: ') + pc.white(this.config.task));
    if (this.config.bundleId) {
      console.log(pc.cyan('📱 App: ') + pc.white(this.config.bundleId));
    } else {
      console.log(pc.cyan('📱 App: ') + pc.dim('(foreground app)'));
    }
    if (this.config.iosDevice) {
      console.log(pc.cyan('📲 iOS Device: ') + pc.white(this.config.iosDevice.udid));
      console.log(pc.cyan('📦 App File: ') + pc.white(this.config.iosDevice.appFile));
    } else if (this.config.deviceId) {
      console.log(pc.cyan('📲 Device: ') + pc.white(this.config.deviceId));
    }
    console.log(pc.cyan('🔄 Max Steps: ') + pc.white(String(this.config.maxSteps)));
    console.log('');

    const actionHistory: string[] = [];

    if (this.maestro.hasBundleId()) {
      const launchSpinner = createSpinner('Launching app...').start();
      try {
        await this.maestro.launch();
        launchSpinner.succeed('App launched');
        actionHistory.push('launched');
        await sleep(3000);
      } catch (error) {
        launchSpinner.fail('Failed to launch app');
        const err = error as Error;
        return { success: false, reason: err.message, steps: 0 };
      }
    } else {
      console.log(pc.dim('Skipping app launch (working with foreground app)'));
      actionHistory.push('ready');
      await sleep(1000);
    }
    let steps = 0;

    // Task execution loop
    while (steps < this.config.maxSteps) {
      steps++;
      console.log(pc.dim(`\n${'─'.repeat(40)}`));
      console.log(pc.bold(`Step ${steps}/${this.config.maxSteps}`));

      const observeSpinner = createSpinner('Capturing screen...').start();
      let screenshot: string;

      try {
        screenshot = await this.maestro.screenshot(steps);
        observeSpinner.succeed('Screen captured');
      } catch (error) {
        observeSpinner.fail('Screenshot failed');
        const err = error as Error;
        console.log(pc.yellow(`  ⚠️ ${err.message}`));
        await sleep(2000);
        continue;
      }

      // Decide
      const thinkSpinner = createSpinner('AI thinking...').start();
      let decision: AgentDecision;

      try {
        decision = await this.agent.decide(screenshot, this.config.task, {
          stepNumber: steps,
          maxSteps: this.config.maxSteps,
          actionHistory,
          successCriteria: this.config.successCriteria,
          constraints: this.config.constraints,
        });
        thinkSpinner.succeed('Decision made');
      } catch (error) {
        thinkSpinner.fail('AI decision failed');
        const err = error as Error;
        console.log(pc.yellow(`  ⚠️ ${err.message}`));
        await sleep(2000);
        continue;
      }

      console.log(pc.dim(`  💭 ${decision.reasoning}`));
      console.log(pc.blue(`  📊 Progress: ${decision.progress}%`));
      console.log(
        pc.green(`  🎬 Action: ${decision.action}`) +
          (decision.params ? pc.dim(` ${JSON.stringify(decision.params)}`) : '')
      );

      // Handle completion
      if (decision.action === 'done') {
        console.log(pc.green('\n✅ Task completed successfully!'));
        return { success: true, reason: decision.reasoning, steps };
      }

      if (decision.action === 'failed') {
        console.log(pc.red('\n❌ Task failed: ') + decision.reasoning);
        return { success: false, reason: decision.reasoning, steps };
      }

      // Execute action
      try {
        await this.executeAction(decision);
        const actionStr = this.formatAction(decision);
        actionHistory.push(actionStr);
      } catch (error) {
        const err = error as Error;
        console.log(pc.yellow(`  ⚠️ Action failed: ${err.message}`));
        actionHistory.push('error');
      }

      await sleep(1500);
    }

    console.log(pc.yellow('\n⏱️ Max steps reached'));
    return { success: false, reason: 'Timeout - max steps exceeded', steps };
  }

  private async executeAction(decision: AgentDecision): Promise<void> {
    const params = decision.params || {};

    switch (decision.action) {
      case 'tap':
        await this.maestro.tap(params.x ?? 50, params.y ?? 50);
        break;

      case 'tapText':
        await this.maestro.tapText(params.text ?? '');
        break;

      case 'doubleTap':
        await this.maestro.doubleTap(params.x ?? 50, params.y ?? 50);
        break;

      case 'longPress':
        if (params.text) {
          await this.maestro.longPressText(params.text);
        } else {
          await this.maestro.longPress(params.x ?? 50, params.y ?? 50);
        }
        break;

      case 'inputText':
        await this.maestro.inputText(params.text ?? '');
        break;

      case 'eraseText':
        await this.maestro.eraseText(params.chars ?? 50);
        break;

      case 'scroll':
        await this.maestro.scroll();
        break;

      case 'swipe':
        await this.maestro.swipe(params.startX ?? 50, params.startY ?? 50, params.endX ?? 50, params.endY ?? 20);
        break;

      case 'back':
        try {
          await this.maestro.back();
        } catch {
          // Fallback to iOS gesture
          await this.maestro.iosBackGesture();
        }
        break;

      case 'hideKeyboard':
        await this.maestro.hideKeyboard();
        break;

      case 'openLink':
        await this.maestro.openLink(params.url ?? '');
        break;

      case 'pressKey':
        await this.maestro.pressKey(params.key ?? 'enter');
        break;

      case 'wait':
        await this.maestro.waitForAnimation(params.timeout ?? 3000);
        break;

      case 'launchApp':
        if (params.appId) {
          await this.maestro.launchApp(params.appId);
        }
        break;

      case 'stopApp':
        if (params.appId) {
          await this.maestro.stopApp(params.appId);
        }
        break;

      default:
        console.log(pc.yellow(`  Unknown action: ${decision.action}`));
    }
  }

  private formatAction(decision: AgentDecision): string {
    const params = decision.params;
    if (!params) return decision.action;

    switch (decision.action) {
      case 'tap':
      case 'doubleTap':
      case 'longPress':
        return `${decision.action}(${params.x},${params.y})`;
      case 'tapText':
      case 'inputText':
        return `${decision.action}("${params.text?.slice(0, 20)}")`;
      case 'swipe':
        return `swipe(${params.startX},${params.startY}->${params.endX},${params.endY})`;
      case 'launchApp':
      case 'stopApp':
        return `${decision.action}("${params.appId}")`;
      default:
        return decision.action;
    }
  }
}
