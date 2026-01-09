import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Codegen service URL (configurable via env)
const CODEGEN_SERVICE_URL = process.env.CODEGEN_SERVICE_URL || 'http://localhost:8081';

/**
 * Generate component code from Figma data
 * POST /api/codegen/generate
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const {
      componentData,
      componentImage,
      config
    } = req.body;

    // Get user info from token
    const userId = req.user.userId;

    // Validate input
    if (!componentData) {
      return res.status(400).json({
        error: 'Component data is required'
      });
    }

    // Add user context to config
    const enhancedConfig = {
      ...config,
      userId,
      timestamp: new Date().toISOString()
    };

    console.log(`📝 Code generation requested by user ${userId}`);

    // Forward request to codegen service
    const response = await axios.post(
      `${CODEGEN_SERVICE_URL}/api/generate`,
      {
        componentData,
        componentImage,
        config: enhancedConfig
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 180000 // 3 minute timeout for generation (13B model is slower)
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error('Code generation error:', error.message);

    if (error.response) {
      // Forward error from codegen service
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({
      error: 'Code generation failed',
      message: error.message
    });
  }
});

/**
 * Generate and publish component to npm
 * POST /api/codegen/generate-and-publish
 */
router.post('/generate-and-publish', authenticateToken, async (req, res) => {
  try {
    const {
      componentData,
      componentImage,
      config
    } = req.body;

    // Get user info from token
    const userId = req.user.userId;

    // Validate input
    if (!componentData) {
      return res.status(400).json({
        error: 'Component data is required'
      });
    }

    // Check if user has permission to publish (could be a premium feature)
    // For now, all authenticated users can publish

    // Add user context to config
    const enhancedConfig = {
      ...config,
      userId,
      timestamp: new Date().toISOString(),
      // Use user's organization scope if available
      packageScope: config?.packageScope || '@uiforge'
    };

    console.log(`📦 Generate & publish requested by user ${userId}`);

    // Forward request to codegen service
    const response = await axios.post(
      `${CODEGEN_SERVICE_URL}/api/generate-and-publish`,
      {
        componentData,
        componentImage,
        config: enhancedConfig
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minute timeout for generation + publishing (13B model is slower)
      }
    );

    // Log successful generation for analytics
    console.log(`✅ Component generated and published: ${response.data.package}`);

    res.json(response.data);

  } catch (error) {
    console.error('Generate and publish error:', error.message);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({
      error: 'Generation and publishing failed',
      message: error.message
    });
  }
});

/**
 * Get available frameworks and styling options
 * GET /api/codegen/options
 */
router.get('/options', (req, res) => {
  res.json({
    frameworks: [
      { value: 'react', label: 'React', available: true },
      { value: 'nextjs', label: 'Next.js', available: true },
      { value: 'angular', label: 'Angular', available: false },
      { value: 'vue', label: 'Vue', available: false }
    ],
    styling: [
      {
        value: 'shadcn',
        label: 'shadcn/ui',
        available: true,
        description: 'Radix UI + Tailwind components',
        status: 'production',
        quality: '90%+'
      },
      {
        value: 'ant-design',
        label: 'Ant Design',
        available: true,
        description: 'Enterprise-grade UI',
        status: 'production',
        quality: '95%+'
      },
      {
        value: 'material-ui',
        label: 'Material-UI (MUI)',
        available: false,
        description: 'Material Design components (Fine-tuning in progress)',
        status: 'experimental',
        quality: '70%'
      },
      {
        value: 'tailwind',
        label: 'Tailwind CSS',
        available: false,
        description: 'Utility-first CSS (Fine-tuning in progress)',
        status: 'experimental',
        quality: '40%'
      },
      {
        value: 'bootstrap',
        label: 'Bootstrap',
        available: false,
        description: 'Popular CSS framework (Fine-tuning in progress)',
        status: 'experimental',
        quality: '20%'
      },
      {
        value: 'chakra-ui',
        label: 'Chakra UI',
        available: false,
        description: 'Simple, modular components (Fine-tuning in progress)',
        status: 'experimental',
        quality: '60%'
      }
    ],
    features: [
      { value: 'typescript', label: 'TypeScript', available: true, default: true },
      { value: 'tests', label: 'Unit Tests', available: true, default: true },
      { value: 'storybook', label: 'Storybook Stories', available: true, default: false },
      { value: 'documentation', label: 'README Documentation', available: true, default: true }
    ]
  });
});

/**
 * Get user's generated components history
 * GET /api/codegen/history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // TODO: Implement database storage for generation history
    // For now, return empty array
    res.json({
      components: [],
      message: 'History feature coming soon'
    });

  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch generation history'
    });
  }
});

/**
 * Health check for codegen service
 * GET /api/codegen/health
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(
      `${CODEGEN_SERVICE_URL}/health`,
      { timeout: 5000 }
    );

    res.json({
      backend: 'healthy',
      codegen: response.data
    });

  } catch (error) {
    res.status(503).json({
      backend: 'healthy',
      codegen: 'unavailable',
      error: error.message
    });
  }
});

export default router;