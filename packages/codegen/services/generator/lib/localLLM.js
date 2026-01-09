import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

/**
 * Local LLM integration for code generation
 * Supports multiple backends: Ollama, llama.cpp, Transformers
 */
export class LocalLLMGenerator {
  constructor(config) {
    this.backend = config.backend || 'ollama'; // 'ollama', 'llamacpp', 'transformers', 'custom'
    this.modelName = config.modelName || 'codellama:7b';
    this.apiUrl = config.apiUrl || 'http://localhost:11434'; // Ollama default
    this.temperature = config.temperature || 0.2;
    this.maxTokens = config.maxTokens || 8192; // Increased for larger components
  }

  /**
   * Generate component code using local LLM
   */
  async generateComponent(componentData, config) {
    const prompt = this.buildPrompt(componentData, config);

    switch (this.backend) {
      case 'ollama':
        return await this.generateWithOllama(prompt);
      case 'llamacpp':
        return await this.generateWithLlamaCpp(prompt);
      case 'transformers':
        return await this.generateWithTransformers(prompt);
      case 'custom':
        return await this.generateWithCustomAPI(prompt);
      default:
        throw new Error(`Unsupported backend: ${this.backend}`);
    }
  }

  /**
   * Build prompt for code generation
   */
  buildPrompt(componentData, config) {
    const { componentName, framework, typescript, styling, includeTests } = config;

    // Specialized prompt for code generation models (CodeLlama format)
    let prompt = `[INST] You are an expert React/Next.js developer. Generate production-ready component code.

Generate a ${framework} component with these specifications:

Component Name: ${componentName}
TypeScript: ${typescript ? 'Yes' : 'No'}
Styling: ${styling}

Design Data:
${JSON.stringify(componentData, null, 2)}

Requirements:
1. Create a fully functional, reusable component
2. Use semantic HTML and accessibility attributes
3. ${typescript ? 'Include TypeScript types and interfaces' : 'Use plain JavaScript'}
4. Make the component customizable via props
5. Ensure responsive design
6. Follow React best practices`;

    // Add styling-specific instructions
    if (styling === 'shadcn') {
      prompt += `
7. Use shadcn/ui component library with Tailwind CSS
8. Import components from '@/components/ui' (e.g., Button, Card)
9. Use the cn() utility for className merging
10. Map Figma properties to shadcn component props (variant, size, etc.)
11. Make the component composable using shadcn primitives`;
    } else if (styling === 'styled-components') {
      prompt += `
7. Use styled-components for all styling
8. Create themed components with variant props
9. Export styled components separately`;
    } else if (styling === 'tailwind') {
      prompt += `
7. Use Tailwind CSS utility classes
8. Accept className prop for customization
9. Use Tailwind's responsive modifiers`;
    } else if (styling === 'css-modules') {
      prompt += `
7. Import styles from .module.css file
8. Use CSS modules for scoped styling
9. Provide CSS class names as props`;
    }

    prompt += `

IMPORTANT: Generate ONLY valid, production-ready ${typescript ? 'TypeScript' : 'JavaScript'} code. Start with imports, then the component. No explanations, no placeholders, no template markers. [/INST]`;

    return prompt;
  }

  /**
   * Generate using Ollama (recommended for local development)
   */
  async generateWithOllama(prompt, onProgress = null) {
    try {
      console.log('🤖 Starting LLM generation with', this.modelName);

      if (onProgress) {
        onProgress({ status: 'generating', message: 'Generating component code with LLM...', progress: 10 });
      }

      const response = await axios.post(
        `${this.apiUrl}/api/generate`,
        {
          model: this.modelName,
          prompt: prompt,
          stream: false,
          options: {
            temperature: this.temperature,
            num_predict: this.maxTokens,
            stop: ['[INST]', '</s>', '[/INST]'],
            num_gpu: 99 // Use all available GPU layers
          }
        },
        {
          timeout: 600000 // 10 minute timeout for large prompts with 13B model on GPU
        }
      );

      if (onProgress) {
        onProgress({ status: 'extracting', message: 'Extracting and cleaning code...', progress: 80 });
      }

      const code = this.extractCodeFromResponse(response.data.response);

      if (onProgress) {
        onProgress({ status: 'complete', message: 'Code generation complete', progress: 90 });
      }

      return code;

    } catch (error) {
      console.error('Ollama generation error:', error);
      throw new Error(`Ollama generation failed: ${error.message}`);
    }
  }

  /**
   * Generate using llama.cpp server
   */
  async generateWithLlamaCpp(prompt) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/completion`,
        {
          prompt: prompt,
          n_predict: this.maxTokens,
          temperature: this.temperature,
          stop: ['<|end|>', '<|user|>', '```\n\n']
        },
        {
          timeout: 60000
        }
      );

      return this.extractCodeFromResponse(response.data.content);

    } catch (error) {
      console.error('Llama.cpp generation error:', error);
      throw new Error(`Llama.cpp generation failed: ${error.message}`);
    }
  }

  /**
   * Generate using Hugging Face Transformers (Python backend required)
   */
  async generateWithTransformers(prompt) {
    try {
      // This assumes you have a Python server running with transformers
      const response = await axios.post(
        `${this.apiUrl}/generate`,
        {
          prompt: prompt,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          model: this.modelName
        },
        {
          timeout: 60000
        }
      );

      return this.extractCodeFromResponse(response.data.generated_text);

    } catch (error) {
      console.error('Transformers generation error:', error);
      throw new Error(`Transformers generation failed: ${error.message}`);
    }
  }

  /**
   * Generate using custom API endpoint (for your fine-tuned model)
   */
  async generateWithCustomAPI(prompt) {
    try {
      // Call your custom API endpoint in uiforge-ai
      const response = await axios.post(
        `${this.apiUrl}/api/generate/code`,
        {
          prompt: prompt,
          componentData: componentData,
          config: {
            temperature: this.temperature,
            max_tokens: this.maxTokens
          }
        },
        {
          timeout: 60000
        }
      );

      return response.data.code || this.extractCodeFromResponse(response.data.generated);

    } catch (error) {
      console.error('Custom API generation error:', error);
      throw new Error(`Custom API generation failed: ${error.message}`);
    }
  }

  /**
   * Extract code from LLM response
   */
  extractCodeFromResponse(response) {
    // Remove any markdown code blocks
    let code = response;

    // Try to extract code between backticks
    const codeBlockMatch = response.match(/```(?:jsx?|tsx?|javascript|typescript)?\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      code = codeBlockMatch[1];
    }

    // Clean up common artifacts and template markers
    code = code.replace(/\[INST\][\s\S]*?\[\/INST\]/g, '');
    code = code.replace(/<\|end\|>/g, '');
    code = code.replace(/<\|assistant\|>/g, '');
    code = code.replace(/<\|user\|>/g, '');
    code = code.replace(/<s>/g, '');
    code = code.replace(/<\/s>/g, '');

    // Remove any remaining template placeholders
    code = code.replace(/<\|[^|]+\|>/g, '');

    return code.trim();
  }

  /**
   * Check if local LLM is available
   */
  async checkAvailability() {
    try {
      switch (this.backend) {
        case 'ollama':
          const ollamaResponse = await axios.get(`${this.apiUrl}/api/tags`);
          return ollamaResponse.data.models?.some(m => m.name.includes(this.modelName));

        case 'llamacpp':
          const llamaResponse = await axios.get(`${this.apiUrl}/health`);
          return llamaResponse.status === 200;

        case 'transformers':
        case 'custom':
          const customResponse = await axios.get(`${this.apiUrl}/health`);
          return customResponse.status === 200;

        default:
          return false;
      }
    } catch (error) {
      console.error('Availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Install Ollama model if not present
   */
  async ensureOllamaModel() {
    if (this.backend !== 'ollama') return;

    try {
      const available = await this.checkAvailability();
      if (!available) {
        console.log(`Pulling Ollama model: ${this.modelName}`);
        await execAsync(`ollama pull ${this.modelName}`);
        console.log('Model downloaded successfully');
      }
    } catch (error) {
      console.error('Failed to ensure Ollama model:', error);
    }
  }
}

/**
 * Factory function to create appropriate LLM generator
 */
export function createLLMGenerator(config = {}) {
  // Check environment variables for configuration
  const backend = config.backend || process.env.LLM_BACKEND || 'ollama';
  const modelName = config.modelName || process.env.LLM_MODEL || 'codellama:7b';
  const apiUrl = config.apiUrl || process.env.LLM_API_URL || 'http://localhost:11434';

  return new LocalLLMGenerator({
    backend,
    modelName,
    apiUrl,
    temperature: config.temperature || 0.2,
    maxTokens: config.maxTokens || 4096
  });
}

/**
 * List of recommended models for code generation
 */
export const RECOMMENDED_MODELS = {
  ollama: [
    'codellama:7b',        // Best for code generation
    'codellama:13b',       // Larger, more accurate
    'mistral:7b',          // Good general purpose
    'deepseek-coder:6.7b', // Specialized for code
    'starcoder:7b',        // Another code-specific model
    'phind-codellama:34b'  // Very large, high quality
  ],
  transformers: [
    'codellama/CodeLlama-7b-Instruct-hf',
    'codellama/CodeLlama-13b-Instruct-hf',
    'WizardLM/WizardCoder-Python-7B-V1.0',
    'bigcode/starcoder',
    'Salesforce/codegen2-7B'
  ]
};

export default LocalLLMGenerator;