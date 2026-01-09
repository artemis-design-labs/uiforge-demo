import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { generateComponent } from './lib/componentGenerator.js';
import { publishToNpm } from './lib/npmPublisher.js';
import { validateComponentData } from './lib/validator.js';

dotenv.config();

const app = express();
const PORT = process.env.CODEGEN_PORT || 8081;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(helmet());

// Compression middleware (component code can be large)
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'uiforge-codegen' });
});

// Generate component endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const {
      componentData,  // Figma JSON data
      componentImage, // Base64 image (optional for now)
      config
    } = req.body;

    // Validate input
    const validation = validateComponentData(componentData);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid component data',
        details: validation.errors
      });
    }

    // Configuration with defaults
    const generationConfig = {
      framework: config?.framework || 'react',
      typescript: config?.typescript !== false,
      styling: config?.styling || 'styled-components',
      includeTests: config?.includeTests !== false,
      packageScope: config?.packageScope || '@uiforge',
      componentName: config?.componentName || componentData.name || 'Component',
      ...config
    };

    console.log('🎨 Generating component:', generationConfig.componentName);

    // Generate the component code
    const generatedCode = await generateComponent(
      componentData,
      componentImage,
      generationConfig
    );

    res.json({
      success: true,
      component: generatedCode,
      config: generationConfig
    });

  } catch (error) {
    if (isProduction) {
      console.error(`[${new Date().toISOString()}] Generation error: ${error.message}`);
    } else {
      console.error('Generation error:', error);
    }
    res.status(500).json({
      error: 'Component generation failed',
      message: isProduction ? 'An error occurred during generation' : error.message,
      ...((!isProduction) && { stack: error.stack })
    });
  }
});

// Publish component to npm
app.post('/api/publish', async (req, res) => {
  try {
    const {
      component,      // Generated component code
      packageName,    // e.g., @company/button
      version,        // e.g., 1.0.0
      registry        // npm registry URL (optional)
    } = req.body;

    if (!component || !packageName || !version) {
      return res.status(400).json({
        error: 'Missing required fields: component, packageName, version'
      });
    }

    console.log(`📦 Publishing ${packageName}@${version}`);

    // Publish to npm
    const publishResult = await publishToNpm({
      component,
      packageName,
      version,
      registry: registry || 'https://registry.npmjs.org'
    });

    res.json({
      success: true,
      package: publishResult.package,
      url: publishResult.url
    });

  } catch (error) {
    if (isProduction) {
      console.error(`[${new Date().toISOString()}] Publish error: ${error.message}`);
    } else {
      console.error('Publish error:', error);
    }
    res.status(500).json({
      error: 'Package publishing failed',
      message: isProduction ? 'An error occurred during publishing' : error.message,
      ...((!isProduction) && { stack: error.stack })
    });
  }
});

// Generate and publish in one step
app.post('/api/generate-and-publish', async (req, res) => {
  try {
    const { componentData, componentImage, config } = req.body;

    // First generate
    const generationConfig = {
      framework: config?.framework || 'react',
      typescript: config?.typescript !== false,
      styling: config?.styling || 'styled-components',
      includeTests: config?.includeTests !== false,
      packageScope: config?.packageScope || '@uiforge',
      componentName: config?.componentName || componentData.name || 'Component',
      ...config
    };

    const generatedCode = await generateComponent(
      componentData,
      componentImage,
      generationConfig
    );

    // Then publish
    const packageName = `${generationConfig.packageScope}/${generationConfig.componentName.toLowerCase()}`;
    const version = config?.version || '1.0.0';

    const publishResult = await publishToNpm({
      component: generatedCode,
      packageName,
      version,
      registry: config?.registry
    });

    res.json({
      success: true,
      component: generatedCode,
      package: publishResult.package,
      url: publishResult.url,
      installCommand: `npm install ${packageName}@${version}`
    });

  } catch (error) {
    if (isProduction) {
      console.error(`[${new Date().toISOString()}] Generate and publish error: ${error.message}`);
    } else {
      console.error('Generate and publish error:', error);
    }
    res.status(500).json({
      error: 'Generation and publishing failed',
      message: isProduction ? 'An error occurred during generation and publishing' : error.message,
      ...((!isProduction) && { stack: error.stack })
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 UIForge Codegen Service running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Generate API: http://localhost:${PORT}/api/generate`);
  console.log(`   Publish API:  http://localhost:${PORT}/api/publish`);
});

export default app;