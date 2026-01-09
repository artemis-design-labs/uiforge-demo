#!/bin/bash

echo "🤖 UIForge Local LLM Setup"
echo "========================="
echo ""

# Check OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "Detected OS: ${MACHINE}"
echo ""

# Function to install Ollama
install_ollama() {
    echo "📦 Installing Ollama..."

    if [ "${MACHINE}" == "Mac" ]; then
        # macOS installation
        if command -v brew &> /dev/null; then
            brew install ollama
        else
            echo "Installing via curl..."
            curl -fsSL https://ollama.ai/install.sh | sh
        fi
    elif [ "${MACHINE}" == "Linux" ]; then
        # Linux installation
        curl -fsSL https://ollama.ai/install.sh | sh
    else
        echo "❌ Unsupported OS. Please install Ollama manually from https://ollama.ai"
        exit 1
    fi
}

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama not found. Would you like to install it? (y/n)"
    read -r INSTALL_OLLAMA
    if [ "$INSTALL_OLLAMA" = "y" ]; then
        install_ollama
    else
        echo "⚠️  Ollama is required for local LLM. Please install from https://ollama.ai"
        exit 1
    fi
else
    echo "✅ Ollama is already installed"
fi

# Start Ollama service
echo ""
echo "🚀 Starting Ollama service..."
ollama serve &> /dev/null &
OLLAMA_PID=$!
sleep 3

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "✅ Ollama service is running"
else
    echo "❌ Failed to start Ollama service"
    echo "Try running manually: ollama serve"
    exit 1
fi

# Pull recommended models
echo ""
echo "📥 Downloading recommended models for code generation..."
echo "This may take a while depending on your internet connection..."
echo ""

# Array of models to download
MODELS=(
    "codellama:7b"
    "deepseek-coder:6.7b"
)

for MODEL in "${MODELS[@]}"; do
    echo "Downloading ${MODEL}..."
    if ollama pull "$MODEL"; then
        echo "✅ ${MODEL} downloaded successfully"
    else
        echo "⚠️  Failed to download ${MODEL}"
    fi
    echo ""
done

# Optional larger models
echo "Would you like to download larger, more accurate models? (y/n)"
echo "Note: These require more disk space and RAM"
read -r DOWNLOAD_LARGE

if [ "$DOWNLOAD_LARGE" = "y" ]; then
    LARGE_MODELS=(
        "codellama:13b"
        "phind-codellama:34b"
    )

    for MODEL in "${LARGE_MODELS[@]}"; do
        echo "Downloading ${MODEL}..."
        ollama pull "$MODEL"
        echo ""
    done
fi

# Create .env file if it doesn't exist
ENV_FILE="services/generator/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo "📝 Creating .env configuration..."
    cp services/generator/.env.example "$ENV_FILE"

    # Set local LLM as default
    sed -i.bak 's/LLM_PROVIDER=.*/LLM_PROVIDER=local/' "$ENV_FILE"
    sed -i.bak 's/LLM_BACKEND=.*/LLM_BACKEND=ollama/' "$ENV_FILE"
    sed -i.bak 's/LLM_MODEL=.*/LLM_MODEL=codellama:7b/' "$ENV_FILE"

    echo "✅ Configuration created"
fi

# Test the setup
echo ""
echo "🧪 Testing local LLM setup..."
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "codellama:7b",
    "prompt": "// Generate a simple React button component\nfunction Button",
    "stream": false,
    "options": {
      "temperature": 0.2,
      "num_predict": 100
    }
  }' 2>/dev/null | python3 -m json.tool > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Local LLM is working correctly!"
else
    echo "⚠️  LLM test failed. Please check Ollama service."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Available models:"
ollama list

echo ""
echo "📚 Next steps:"
echo "1. Start the codegen service:"
echo "   cd services/generator && npm install && npm run dev"
echo ""
echo "2. The service will use local LLM by default"
echo ""
echo "3. To switch between local and Anthropic:"
echo "   Edit services/generator/.env"
echo "   Set LLM_PROVIDER=local or LLM_PROVIDER=anthropic"
echo ""
echo "4. To use a different model:"
echo "   Edit LLM_MODEL in .env (e.g., codellama:13b)"
echo ""
echo "Happy coding! 🚀"