import { OpenRouterModelPicker } from '@/components/OpenRouterConnection';
import type { ModelConfig } from '@/types/misc';
import type { Model } from '@shared/types';
interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModel: string;
  onModelChange: (modelId: Model) => void;
  disabled?: boolean;
  className?: string;
  type?: 'parametric' | 'creative';
  focused?: boolean;
}
export function ModelSelector({ disabled }: ModelSelectorProps) {
  return <OpenRouterModelPicker disabled={disabled} />;
}
