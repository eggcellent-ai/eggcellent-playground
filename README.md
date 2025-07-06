# 🥚 Eggcellent

Eggcellent is the fastest way to test and debug AI prompts for your application. Compare outputs across models, manage prompt versions, and validate structured results — all in a clean, local-first playground.

![Eggcellent Screenshot](public/image.png)

## ✨ Features

- 🚀 **Multi-Model Testing**: Compare responses from OpenAI, Anthropic, Google, and xAI models side by side
- 🔄 **Prompt Version Control**: Track and manage different versions of your prompts
- 🔒 **Local-First Security**: Your API keys and prompts stay secure in your browser
- 📊 **Structured Output Validation**: Ensure your prompts produce the expected format
- 🖼️ **Multi-Modal Support**: Test prompts with both text and images
- ⚡ **Real-Time Streaming**: See responses stream in real-time
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile

## 🚀 Quick Start

1. Clone the repository:

```bash
git clone https://github.com/yourusername/eggcellent.git
cd eggcellent
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## 🔑 API Key Management

Eggcellent uses a local-first approach to API key management:

- API keys are stored securely in your browser's local storage
- Keys are never sent to any server
- Optional session-only storage (cleared on browser close)
- Visual indicators for storage security status
- Automatic key validation before storage

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Tech Stack

- ⚛️ React + TypeScript
- 🏃‍♂️ Vite
- 🎨 TailwindCSS
- 📦 Zustand (State Management)
- 🔄 React Router
- 🧪 AI SDK

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📖 Documentation

For detailed documentation, check out:

- [Security Guide](docs/security.md)
- [API Integration Guide](docs/api-integration.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Architecture Overview](docs/architecture.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 🔒 Security

- API keys are stored locally in your browser
- No data is sent to external servers except direct API calls to AI providers
- All processing happens client-side
- Optional enhanced security features available

See our [Security Guide](docs/security.md) for best practices and recommendations.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [TailwindCSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)

---

<p align="center">Made with ❤️ for the AI developer community</p>
