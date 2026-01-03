# 📱 mobile-use

**AI-powered mobile task automation using natural language**

Execute complex tasks on mobile apps by simply describing what you want to do. mobile-use uses GPT-4o vision to see your screen and Maestro to control the device.

```bash
mobile-use com.apple.mobilenotes "Create a new note titled 'Meeting Notes' with bullet points for agenda items"
```

## ✨ Features

- 🧠 **Vision-First AI** - Uses GPT-4o to understand screenshots and decide actions
- 📝 **Natural Language Tasks** - Describe what you want in plain English
- 📱 **Cross-Platform** - Works with iOS simulators and Android devices/emulators
- 🔌 **Physical iOS Devices** - Supports real iPhones via `maestro-ios-device`
- 🔄 **Multi-App Workflows** - Switch between apps to complete complex tasks
- 🎯 **Smart Recovery** - Detects when stuck and tries alternative approaches
- ⚡ **Fast Execution** - Optimized for speed with minimal overhead

## 📋 Requirements

- **Node.js** 18+
- **macOS** (for iOS) or **macOS/Linux/Windows** (for Android)
- **OpenAI API Key** with GPT-4o access
- **Maestro CLI** (auto-installed via `mobile-use install-maestro`)

### For iOS Simulator
- Xcode with iOS Simulator

### For Android
- Android SDK with emulator or ADB-connected device

### For Physical iOS Devices
- macOS with Xcode
- Apple Developer account (free tier works)
- `maestro-ios-device` (install via `mobile-use install-ios-device`)

## 🚀 Installation

```bash
# Install from npm
npm install -g mobile-use

# Set your OpenAI API key
export OPENAI_API_KEY=your_api_key_here

# Install Maestro CLI
mobile-use install-maestro

# Verify installation
mobile-use check
```

## 📖 Usage

### Basic Usage

```bash
# Run a task on a specific app
mobile-use <bundleId> "<task>"

# Example: Create a note
mobile-use com.apple.mobilenotes "Create a new note titled 'Hello World'"

# Example: Send a message
mobile-use com.apple.MobileSMS "Send 'Running late!' to John"
```

### Without Bundle ID (Foreground App)

Run tasks on whatever app is currently visible:

```bash
# Using --task flag
mobile-use --task "Tap the settings icon"

# Or just pass the task directly
mobile-use "Scroll down and tap on Privacy"
```

### With Custom Options

```bash
mobile-use com.example.app "Complete the checkout flow" \
  --max-steps 50 \
  --model gpt-4o \
  --criteria "Order confirmation is visible" \
  --constraint "Don't use saved payment methods"
```

### Android Device Selection

```bash
# List connected devices
adb devices

# Run on specific device/emulator
mobile-use com.example.app "task" --device emulator-5554
```

### Physical iOS Device

```bash
# 1. Install the iOS device bridge
mobile-use install-ios-device

# 2. Get your device info
xcrun xctrace list devices                              # Get UDID
security find-identity -v -p codesigning | grep "Dev"   # Get Team ID

# 3. Start the bridge (keep running in separate terminal)
maestro-ios-device --team-id YOUR_TEAM_ID --device DEVICE_UDID

# 4. Run mobile-use
mobile-use com.example.app "Create a note" \
  --ios-device DEVICE_UDID \
  --team-id YOUR_TEAM_ID \
  --app-file /path/to/app.ipa
```

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `mobile-use <bundleId> <task>` | Run a task on the specified app |
| `mobile-use run <bundleId> <task>` | Same as above (explicit run command) |
| `mobile-use check` | Verify environment is properly configured |
| `mobile-use install-maestro` | Install Maestro CLI |
| `mobile-use install-ios-device` | Install maestro-ios-device (macOS only) |
| `mobile-use --help` | Show help information |

## ⚙️ Options

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --task <task>` | Task to execute (when bundleId is omitted) | - |
| `-m, --max-steps <n>` | Maximum steps before timeout | `100` |
| `--model <name>` | OpenAI model to use | `gpt-4o` |
| `--device <id>` | Android device ID | - |
| `--ios-device <udid>` | Physical iOS device UDID | - |
| `--team-id <id>` | Apple Developer Team ID | - |
| `--app-file <path>` | Path to .ipa file | - |
| `--driver-port <port>` | iOS driver port | `6001` |
| `--criteria <...>` | Success criteria (can specify multiple) | - |
| `--constraint <...>` | Constraints (can specify multiple) | - |

## 🎬 Available Actions

The AI can perform these actions on your device:

| Action | Description | Example |
|--------|-------------|---------|
| `tap` | Tap at coordinates (% of screen) | `tap(50, 50)` |
| `tapText` | Tap element with visible text | `tapText("Submit")` |
| `doubleTap` | Double-tap at coordinates | `doubleTap(50, 50)` |
| `longPress` | Long press at coordinates or text | `longPress(50, 50)` |
| `inputText` | Type text into focused field | `inputText("Hello")` |
| `eraseText` | Delete characters | `eraseText(10)` |
| `scroll` | Scroll down | `scroll()` |
| `swipe` | Swipe gesture | `swipe(50,80 → 50,20)` |
| `back` | Navigate back | `back()` |
| `hideKeyboard` | Dismiss keyboard | `hideKeyboard()` |
| `openLink` | Open a URL/deep link | `openLink("app://...")` |
| `pressKey` | Press a key (enter, etc.) | `pressKey("enter")` |
| `wait` | Wait for animations | `wait()` |
| `launchApp` | Switch to another app | `launchApp("com.other.app")` |
| `stopApp` | Close an app | `stopApp("com.other.app")` |

## 🏗️ How It Works

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   mobile-use    │────▶│   GPT-4o     │────▶│    Maestro      │
│   (CLI/Node)    │     │  (Vision AI) │     │   (Automation)  │
└─────────────────┘     └──────────────┘     └─────────────────┘
        │                      │                      │
        │                      │                      ▼
        │                      │              ┌───────────────┐
        │                      │              │   Device      │
        │                      │              │ (iOS/Android) │
        │                      │              └───────────────┘
        │                      │                      │
        ▼                      ▼                      ▼
   1. Capture          2. Analyze &           3. Execute
   Screenshot          Decide Action          Action
```

**Loop:**
1. **Observe** - Take a screenshot of the current screen
2. **Decide** - GPT-4o analyzes the image and decides the next action
3. **Execute** - Maestro performs the action on the device
4. **Repeat** - Until task is complete or max steps reached

## 📱 Physical iOS Device Setup

### Prerequisites
- macOS with Xcode installed
- Apple Developer account (free tier works for personal devices)
- iOS device running iOS 16.x - 18.x

### Step-by-Step Setup

1. **Install tools:**
   ```bash
   mobile-use install-maestro
   mobile-use install-ios-device
   ```

2. **Connect and configure device:**
   - Connect iPhone via USB cable
   - Trust the computer when prompted
   - Enable Developer Mode:
     - Settings → Privacy & Security → Developer Mode → Enable
   - Enable UI Automation:
     - Settings → Developer → Enable UI Automation

3. **Get device information:**
   ```bash
   # Find your device UDID
   xcrun xctrace list devices
   
   # Find your Team ID
   security find-identity -v -p codesigning | grep "Developer"
   ```

4. **Start the bridge (keep this terminal open):**
   ```bash
   maestro-ios-device --team-id YOUR_TEAM_ID --device DEVICE_UDID
   ```

5. **Run mobile-use in another terminal:**
   ```bash
   mobile-use com.example.app "Your task here" \
     --ios-device DEVICE_UDID \
     --team-id YOUR_TEAM_ID \
     --app-file /path/to/app.ipa
   ```

### Limitations on Physical iOS
| Feature | Status |
|---------|--------|
| Tap, swipe, input | ✅ Works |
| Screenshots | ✅ Works |
| App launch | ✅ Works |
| clearState | ⚠️ Reinstalls app |
| setLocation | ⚠️ Limited |
| addMedia | ❌ Not supported |

## 🔍 Examples

### E-commerce Checkout
```bash
mobile-use com.amazon.Amazon "Search for 'wireless headphones', add the first result to cart, and proceed to checkout"
```

### Social Media
```bash
mobile-use com.instagram.instagram "Post the most recent photo from my camera roll with the caption 'Beautiful sunset!'"
```

### Productivity
```bash
mobile-use com.apple.mobilenotes "Create a new note titled 'Shopping List' with items: milk, eggs, bread, butter"
```

### Multi-App Workflow
```bash
mobile-use com.apple.mobilesafari "Copy the headline from cnn.com, then open Notes and paste it into a new note"
```

### Testing with Constraints
```bash
mobile-use com.myapp.test "Complete the signup flow" \
  --criteria "Welcome screen is displayed" \
  --criteria "User profile shows correct email" \
  --constraint "Use email: test@example.com" \
  --constraint "Skip optional fields"
```

## 🐛 Troubleshooting

### "Maestro not installed"
```bash
mobile-use install-maestro
# Then add to PATH:
export PATH="$PATH:$HOME/.maestro/bin"
```

### "API key not found"
```bash
export OPENAI_API_KEY=your_key_here
# Add to ~/.zshrc or ~/.bashrc for persistence
```

### AI keeps tapping wrong coordinates
The AI estimates tap positions as percentages. If it's consistently wrong:
- The AI will auto-detect stuck patterns and try alternatives
- Use `tapText` instead when there's visible text
- Increase `--max-steps` to give it more attempts

### Physical iOS device not found
```bash
# Check device is connected
xcrun xctrace list devices

# Ensure Developer Mode is enabled
# Settings → Privacy & Security → Developer Mode

# Re-trust the computer
# Unplug and replug, tap "Trust" when prompted
```

### maestro-ios-device bridge crashes
```bash
# Check iOS version compatibility (16.x - 18.x)
# Ensure Xcode is up to date
# Check device logs: Window → Devices and Simulators → View Device Logs
```

## 📄 License

MIT

## 🙏 Acknowledgments

- [Maestro](https://maestro.mobile.dev) - Mobile UI automation framework
- [OpenAI GPT-4o](https://openai.com) - Vision-language model
- [maestro-ios-device](https://github.com/devicelab-dev/maestro-ios-device) - Physical iOS device support
