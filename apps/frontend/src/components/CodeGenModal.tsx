'use client';

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CodeGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentData?: any;
}

export function CodeGenModal({ isOpen, onClose, componentData }: CodeGenModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [options, setOptions] = useState<any>(null);
  const [progress, setProgress] = useState({ message: '', progress: 0 });
  const [currentStage, setCurrentStage] = useState<string>('');
  const [stages, setStages] = useState<{name: string, status: 'pending' | 'active' | 'complete' | 'error'}[]>([]);
  const [config, setConfig] = useState({
    framework: 'react',
    styling: 'shadcn',
    typescript: true,
    includeTests: false,
    includeStorybook: false,
    packageScope: '@uiforge',
    componentName: '',
    publish: false
  });

  const instanceData = useAppSelector((state) => state.figma.instanceData);

  useEffect(() => {
    // Fetch available options
    fetchOptions();

    // Set component name from data
    if (componentData?.name || instanceData?.name) {
      setConfig(prev => ({
        ...prev,
        componentName: componentData?.name || instanceData?.name || 'Component'
      }));
    }
  }, [componentData, instanceData]);

  const fetchOptions = async () => {
    try {
      const response = await axios.get('/api/v1/codegen/options');
      setOptions(response.data);
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  const updateStage = (stageName: string, status: 'active' | 'complete' | 'error') => {
    setStages(prev => {
      const index = prev.findIndex(s => s.name === stageName);
      if (index === -1) return prev;

      const newStages = [...prev];
      newStages[index] = { ...newStages[index], status };

      // Mark previous stages as complete if current is active
      if (status === 'active') {
        for (let i = 0; i < index; i++) {
          if (newStages[i].status !== 'complete') {
            newStages[i].status = 'complete';
          }
        }
      }

      return newStages;
    });
    if (status === 'active') {
      setCurrentStage(stageName);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress({ message: 'Initializing...', progress: 0 });

    // Initialize stages based on configuration
    const generationStages = [
      { name: 'Validating', status: 'pending' as const },
      { name: 'Generating Code', status: 'pending' as const },
      { name: 'Formatting', status: 'pending' as const },
      { name: 'Creating Files', status: 'pending' as const },
    ];

    if (config.publish) {
      generationStages.push(
        { name: 'Building Package', status: 'pending' as const },
        { name: 'Publishing to NPM', status: 'pending' as const }
      );
    }

    generationStages.push({ name: 'Complete', status: 'pending' as const });
    setStages(generationStages);

    try {
      const endpoint = config.publish
        ? '/api/v1/codegen/generate-and-publish'
        : '/api/v1/codegen/generate';

      // Stage 1: Validating
      updateStage('Validating', 'active');
      setProgress({ message: 'Validating component data...', progress: 10 });
      await new Promise(resolve => setTimeout(resolve, 300));
      updateStage('Validating', 'complete');

      // Stage 2: Generating Code
      updateStage('Generating Code', 'active');
      setProgress({ message: 'Generating component with CodeLlama 13B...', progress: 20 });

      const response = await axios.post(endpoint, {
        componentData: componentData || instanceData,
        config
      }, {
        withCredentials: true,
        timeout: 300000 // 5 minute timeout for 13B model
      });

      // Stage 3: Formatting
      updateStage('Generating Code', 'complete');
      updateStage('Formatting', 'active');
      setProgress({ message: 'Formatting code with Prettier...', progress: 70 });
      await new Promise(resolve => setTimeout(resolve, 300));
      updateStage('Formatting', 'complete');

      // Stage 4: Creating Files
      updateStage('Creating Files', 'active');
      setProgress({ message: 'Creating additional files (types, README)...', progress: 80 });
      await new Promise(resolve => setTimeout(resolve, 300));
      updateStage('Creating Files', 'complete');

      if (config.publish) {
        // Stage 5: Building Package
        updateStage('Building Package', 'active');
        setProgress({ message: 'Building package with Rollup...', progress: 85 });
        await new Promise(resolve => setTimeout(resolve, 500));
        updateStage('Building Package', 'complete');

        // Stage 6: Publishing
        updateStage('Publishing to NPM', 'active');
        setProgress({ message: 'Publishing to npm registry...', progress: 95 });
        await new Promise(resolve => setTimeout(resolve, 500));
        updateStage('Publishing to NPM', 'complete');
      }

      // Final stage
      updateStage('Complete', 'active');
      setProgress({ message: 'Complete!', progress: 100 });
      updateStage('Complete', 'complete');

      if (response.data.success) {
        setSuccess(config.publish
          ? `Component published! Install with: ${response.data.installCommand}`
          : 'Component generated successfully!'
        );

        // If not publishing, offer download
        if (!config.publish && response.data.component) {
          downloadComponent(response.data.component, config.componentName);
        }
      }
    } catch (err: any) {
      const errorStage = currentStage || stages.find(s => s.status === 'active')?.name;
      if (errorStage) {
        updateStage(errorStage, 'error');
      }
      setError(err.response?.data?.message || 'Generation failed');
      setProgress({ message: 'Error occurred', progress: 0 });
    } finally {
      setLoading(false);
    }
  };

  const downloadComponent = (component: any, name: string) => {
    // Create a blob with the component code
    const blob = new Blob(
      [JSON.stringify(component, null, 2)],
      { type: 'application/json' }
    );

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase()}-component.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Generate Component Code</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Component Info */}
        <div className="mb-4 p-3 bg-accent/50 rounded">
          <p className="text-sm">
            <strong>Component:</strong> {config.componentName}
          </p>
          <p className="text-sm text-muted-foreground">
            This will generate a reusable React component from your Figma design
          </p>
        </div>

        {/* Configuration Options */}
        <div className="space-y-4">
          {/* Framework Selection */}
          <div>
            <Label htmlFor="framework">Framework</Label>
            <select
              id="framework"
              value={config.framework}
              onChange={(e) => setConfig({...config, framework: e.target.value})}
              className="w-full p-2 border rounded"
              disabled={loading}
            >
              {options?.frameworks?.map((fw: any) => (
                <option key={fw.value} value={fw.value} disabled={!fw.available}>
                  {fw.label} {!fw.available && '(Coming Soon)'}
                </option>
              ))}
            </select>
          </div>

          {/* Styling Method */}
          <div>
            <Label htmlFor="styling">Styling Method</Label>
            <select
              id="styling"
              value={config.styling}
              onChange={(e) => setConfig({...config, styling: e.target.value})}
              className="w-full p-2 border rounded"
              disabled={loading}
            >
              {options?.styling?.map((style: any) => (
                <option key={style.value} value={style.value} disabled={!style.available}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>

          {/* Component Name */}
          <div>
            <Label htmlFor="componentName">Component Name</Label>
            <input
              id="componentName"
              type="text"
              value={config.componentName}
              onChange={(e) => setConfig({...config, componentName: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="e.g., Button, Card, Header"
              disabled={loading}
            />
          </div>

          {/* Package Scope */}
          <div>
            <Label htmlFor="packageScope">Package Scope</Label>
            <input
              id="packageScope"
              type="text"
              value={config.packageScope}
              onChange={(e) => setConfig({...config, packageScope: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="@yourcompany"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Package will be: {config.packageScope}/{config.componentName.toLowerCase()}
            </p>
          </div>

          {/* Toggle Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="typescript">TypeScript</Label>
              <Switch
                id="typescript"
                checked={config.typescript}
                onCheckedChange={(checked) => setConfig({...config, typescript: checked})}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="publish">Publish to NPM</Label>
              <Switch
                id="publish"
                checked={config.publish}
                onCheckedChange={(checked) => setConfig({...config, publish: checked})}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Stage Tracker */}
        {loading && stages.length > 0 && (
          <div className="mt-4 space-y-3">
            {stages.map((stage, index) => (
              <div key={stage.name} className="flex items-center gap-3">
                {/* Stage Icon */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  stage.status === 'complete' ? 'bg-green-500/20' :
                  stage.status === 'active' ? 'bg-primary/20' :
                  stage.status === 'error' ? 'bg-red-500/20' :
                  'bg-muted'
                }`}>
                  {stage.status === 'complete' && (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {stage.status === 'active' && (
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  {stage.status === 'error' && (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {stage.status === 'pending' && (
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                  )}
                </div>

                {/* Stage Name */}
                <div className={`flex-1 text-sm ${
                  stage.status === 'complete' ? 'text-green-500' :
                  stage.status === 'active' ? 'text-primary font-medium' :
                  stage.status === 'error' ? 'text-red-500' :
                  'text-muted-foreground'
                }`}>
                  {stage.name}
                </div>

                {/* Connector Line */}
                {index < stages.length - 1 && (
                  <div className="absolute left-[11px] w-0.5 h-3 bg-muted" style={{
                    marginTop: '32px',
                    opacity: stage.status === 'complete' ? 1 : 0.3
                  }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {loading && progress.progress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{progress.message}</span>
              <span className="text-muted-foreground">{progress.progress}%</span>
            </div>
            <div className="w-full bg-accent rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 text-red-500 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-500/10 text-green-500 rounded">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={handleGenerate}
            disabled={loading || !config.componentName}
            className="w-full"
          >
            {loading ? 'Generating...' : config.publish ? 'Generate & Publish' : 'Generate Code'}
          </Button>
        </div>
      </div>
    </div>
  );
}