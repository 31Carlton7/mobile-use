import { createOpenAI } from '@ai-sdk/openai';
import { generateText, type ModelMessage } from 'ai';
import type { AgentDecision, AgentContext } from './types.js';

export class TaskAgent {
  private openai: ReturnType<typeof createOpenAI>;
  private conversationHistory: ModelMessage[] = [];
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.openai = createOpenAI({ apiKey });
    this.model = model;
  }

  async decide(
    screenshot: string,
    task: string,
    context: AgentContext
  ): Promise<AgentDecision> {
    const systemPrompt = this.buildSystemPrompt(task, context);
    const imageBuffer = Buffer.from(screenshot, 'base64');

    const stuckWarning = this.detectStuckPattern(context.actionHistory);

    const userMessage: ModelMessage = {
      role: 'user',
      content: [
        { type: 'image', image: imageBuffer },
        {
          type: 'text',
          text: stuckWarning
            ? `${stuckWarning}\n\nAnalyze the screenshot. What DIFFERENT action should you try?`
            : 'Analyze the screenshot. What is the ONE best action to progress toward the task goal?',
        },
      ],
    };

    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-8);
    }

    this.conversationHistory.push(userMessage);

    const model = this.openai(this.model);

    const response = await generateText({
      model,
      system: systemPrompt,
      messages: this.conversationHistory,
    });

    this.conversationHistory.push({
      role: 'assistant',
      content: response.text,
    });

    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    return JSON.parse(jsonMatch[0]) as AgentDecision;
  }

  private detectStuckPattern(history: string[]): string | null {
    if (history.length < 3) return null;

    const lastThree = history.slice(-3);
    const allSame = lastThree.every((a) => a === lastThree[0]);

    if (allSame) {
      return `WARNING: You've tried "${lastThree[0]}" 3 times with no progress. The tap coordinates may be WRONG. Try:
1. DIFFERENT coordinates (shift by 5-10%)
2. tapText instead of tap (if there's visible text)
3. scroll to reveal hidden elements
4. A completely different approach`;
    }

    const tapPattern = lastThree.filter((a) => a.startsWith('tap('));
    if (tapPattern.length >= 2) {
      return `NOTE: Multiple tap attempts detected. If tapping isn't working, the button might be at different coordinates than expected. Try adjusting by 5-10% or use tapText if visible text exists.`;
    }

    return null;
  }

  private buildSystemPrompt(task: string, context: AgentContext): string {
    const criteriaSection = context.successCriteria
      ? `SUCCESS CRITERIA:\n${context.successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
      : '';

    const constraintsSection = context.constraints
      ? `CONSTRAINTS:\n${context.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
      : '';

    return `You are an AI agent controlling a mobile app to complete a task.

OBJECTIVE: ${task}

${criteriaSection}
${constraintsSection}

COORDINATE ESTIMATION GUIDE
You see the screenshot. Estimate tap positions as PERCENTAGES (0-100):
- 0% = left/top edge, 50% = center, 100% = right/bottom edge

Common UI patterns:
- Floating Action Button (FAB, usually "+"): typically at {x: 85, y: 85} NOT {x: 90, y: 90}
- Navigation back arrow: {x: 5-10, y: 6-8}
- Top-right action button: {x: 90-95, y: 6-8}
- Tab bar items: y: 92-96, x varies by position
- Center of screen: {x: 50, y: 50}
- Text fields: estimate center of the field visually

CRITICAL: Don't use exact corners (0, 100). Buttons have padding.

ACTION PRIORITY
1. tapText - BEST when you see readable text on a button. Use EXACT visible text.
2. tap - For icons or when tapText might fail. Estimate coordinates carefully.
3. inputText - ONLY after tapping a text field (you should see cursor/keyboard)
4. scroll - To reveal content below the fold
5. wait - After navigation actions

AVAILABLE ACTIONS

tap: Tap at coordinates
  {"action": "tap", "params": {"x": 85, "y": 85}, "reasoning": "...", "progress": N}

tapText: Tap by visible text (preferred when text is visible)
  {"action": "tapText", "params": {"text": "Add Note"}, "reasoning": "...", "progress": N}

inputText: Type into focused field
  {"action": "inputText", "params": {"text": "Your text here"}, "reasoning": "...", "progress": N}
  For long text (>200 chars): use multiple inputText calls

scroll: Scroll down
  {"action": "scroll", "params": {}, "reasoning": "...", "progress": N}

swipe: Swipe gesture
  {"action": "swipe", "params": {"startX": 50, "startY": 80, "endX": 50, "endY": 20}, "reasoning": "...", "progress": N}

wait: Wait for animations
  {"action": "wait", "params": {}, "reasoning": "...", "progress": N}

hideKeyboard: Dismiss keyboard
  {"action": "hideKeyboard", "params": {}, "reasoning": "...", "progress": N}

launchApp: Switch to a different app (for multi-app tasks)
  {"action": "launchApp", "params": {"appId": "com.example.app"}, "reasoning": "...", "progress": N}

stopApp: Close/stop an app
  {"action": "stopApp", "params": {"appId": "com.example.app"}, "reasoning": "...", "progress": N}

done: Task complete (only when VERIFIED on screen)
  {"action": "done", "params": {}, "reasoning": "...", "progress": 100}

failed: Cannot complete (only after 10+ different attempts)
  {"action": "failed", "params": {}, "reasoning": "...", "progress": N}

WHEN STUCK (same action 2+ times with no change):
1. Your coordinates are probably WRONG - shift by 5-10%
2. Try tapText instead of tap coordinates
3. Try scroll to reveal hidden elements
4. Try a completely different element

PROGRESS: Step ${context.stepNumber}/${context.maxSteps}
Recent: ${context.actionHistory.slice(-5).join(' -> ') || 'none'}

Respond with ONLY valid JSON (no markdown):`;
  }

  reset(): void {
    this.conversationHistory = [];
  }
}
