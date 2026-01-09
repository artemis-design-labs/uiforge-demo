/**
 * Training API Service
 * Client for UIForge ML API
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8001/api/v1';

export interface TrainingJob {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'stopped' | 'failed';
  model_size: string;
  epochs: number;
  batch_size: number;
  image_size: number;
  pid: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  current_epoch: number;
  total_epochs: number;
  box_loss: number | null;
  cls_loss: number | null;
  dfl_loss: number | null;
  map50: number | null;
  precision: number | null;
  recall: number | null;
  best_map50: number | null;
  training_time_seconds: number | null;
  model_path: string | null;
  error_message: string | null;
}

export interface StartTrainingRequest {
  model_size?: string;
  epochs?: number;
  batch_size?: number;
  image_size?: number;
}

export interface GPUStats {
  gpu_name: string;
  vram_used: number | null;
  vram_total: number | null;
  vram_percent: number | null;
  gpu_utilization: number | null;
  temperature: number | null;
  power_usage: number | null;
}

export interface SystemStatus {
  cpu: {
    percent: number;
    count: number;
  };
  ram: {
    total_gb: number;
    used_gb: number;
    percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    percent: number;
  };
  gpu: GPUStats;
  training: {
    output_dir: string;
    total_jobs: number;
  };
}

export interface Model {
  job_id: string;
  model_path: string;
  model_size_mb: number;
  has_last_weights: boolean;
  best_metrics: any;
  total_epochs: number;
  plots: string[];
}

export interface DetectionResult {
  class: string;
  confidence: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface InferenceResponse {
  success: boolean;
  detections: DetectionResult[];
  count: number;
  processing_time: number;
  model_used: string;
  image_size: {
    width: number;
    height: number;
  };
}

class TrainingAPI {
  private client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });

  // Training endpoints
  async startTraining(config: StartTrainingRequest): Promise<TrainingJob> {
    const response = await this.client.post('/training/start', config);
    return response.data;
  }

  async stopTraining(jobId: string): Promise<{ message: string }> {
    const response = await this.client.post(`/training/stop/${jobId}`);
    return response.data;
  }

  async getAllJobs(limit: number = 50): Promise<TrainingJob[]> {
    const response = await this.client.get('/training/jobs', {
      params: { limit },
    });
    return response.data;
  }

  async getJob(jobId: string): Promise<TrainingJob> {
    const response = await this.client.get(`/training/jobs/${jobId}`);
    return response.data;
  }

  // WebSocket connection
  createWebSocket(jobId: string): WebSocket {
    const wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api/v1', '');
    return new WebSocket(`${wsUrl}/api/v1/training/ws/${jobId}`);
  }

  // System endpoints
  async getHealth(): Promise<{ status: string; message: string }> {
    const response = await this.client.get('/system/health');
    return response.data;
  }

  async getGPUStats(): Promise<GPUStats> {
    const response = await this.client.get('/system/gpu');
    return response.data;
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const response = await this.client.get('/system/status');
    return response.data;
  }

  // Models endpoints
  async listModels(): Promise<{ models: Model[] }> {
    const response = await this.client.get('/models/list');
    return response.data;
  }

  async getModelMetrics(jobId: string): Promise<any> {
    const response = await this.client.get(`/models/metrics/${jobId}`);
    return response.data;
  }

  getDownloadUrl(jobId: string): string {
    return `${API_BASE_URL}/models/download/${jobId}`;
  }

  getPlotUrl(jobId: string, plotName: string): string {
    return `${API_BASE_URL}/models/plot/${jobId}/${plotName}`;
  }

  async compareModels(jobIds: string[]): Promise<any> {
    const response = await this.client.get('/models/compare', {
      params: { job_ids: jobIds.join(',') },
    });
    return response.data;
  }

  // Inference endpoints
  async detectObjects(
    imageFile: File,
    jobId?: string,
    confidence: number = 0.25,
    iou: number = 0.45
  ): Promise<InferenceResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (jobId) formData.append('job_id', jobId);
    formData.append('confidence', confidence.toString());
    formData.append('iou', iou.toString());

    const response = await this.client.post('/inference/detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  getDetectAnnotatedUrl(
    jobId?: string,
    confidence: number = 0.25,
    iou: number = 0.45
  ): string {
    const params = new URLSearchParams();
    if (jobId) params.append('job_id', jobId);
    params.append('confidence', confidence.toString());
    params.append('iou', iou.toString());
    return `${API_BASE_URL}/inference/detect-annotated?${params}`;
  }
}

export const trainingApi = new TrainingAPI();
