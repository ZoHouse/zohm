/**
 * 🔺 MCP (Minimum Curvature Path) Utilities
 * 
 * Helper functions that embody MCP principles:
 * - Momentum preservation over rewrites
 * - Graceful error handling over hard failures  
 * - Smooth state transitions over sharp pivots
 * - Future optionality over premature optimization
 */

// ========================
// 🌊 MOMENTUM PRESERVATION
// ========================

/**
 * Wraps async operations to preserve momentum on errors
 * Falls back gracefully instead of breaking the flow
 */
export async function withMomentum<T>(
  operation: () => Promise<T>,
  fallback: T,
  onError?: (error: Error) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    onError?.(error as Error);
    return fallback;
  }
}

/**
 * Preserves existing state during updates
 * Only applies changes that don't break current flow
 */
export function preserveFlow<T extends Record<string, any>>(
  current: T,
  updates: Partial<T>
): T {
  return {
    ...current,
    ...Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    )
  } as T;
}

// ========================
// 🔄 GRACEFUL ERROR HANDLING
// ========================

/**
 * Wraps operations with graceful error boundaries
 * Errors bend the flow rather than breaking it
 */
export function withGracefulError<T extends (...args: any[]) => any>(
  fn: T,
  errorHandler: (error: Error, ...args: Parameters<T>) => ReturnType<T>
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (error) {
      return errorHandler(error as Error, ...args);
    }
  }) as T;
}

/**
 * Creates error states that maintain UI flow
 */
export interface MCPErrorState {
  hasError: boolean;
  error?: Error;
  fallbackValue?: any;
  retryable: boolean;
}

export function createErrorState(
  error: Error | null,
  fallback?: any,
  retryable = true
): MCPErrorState {
  return {
    hasError: !!error,
    error: error || undefined,
    fallbackValue: fallback,
    retryable
  };
}

// ========================
// 🎯 DECISION MAKING
// ========================

/**
 * MCP decision helper - chooses the path with:
 * 1. Least regret (easier to evolve/rollback)
 * 2. Maximum future optionality
 * 3. Minimum architectural curvature
 */
export function mcpDecision<T>(
  options: Array<{
    choice: T;
    regretScore: number;    // Lower is better (0-10)
    optionality: number;    // Higher is better (0-10) 
    curvature: number;      // Lower is better (0-10)
    momentum: number;       // Higher is better (0-10)
  }>
): T {
  const scored = options.map(option => ({
    ...option,
    totalScore: 
      (10 - option.regretScore) * 0.3 +
      option.optionality * 0.3 +
      (10 - option.curvature) * 0.2 +
      option.momentum * 0.2
  }));

  return scored.reduce((best, current) => 
    current.totalScore > best.totalScore ? current : best
  ).choice;
}

// ========================
// 📊 FEEDBACK LOOPS
// ========================

/**
 * Adds observable checkpoints for early path verification
 */
export function withCheckpoint<T>(
  value: T,
  checkpoint: string,
  logger?: (checkpoint: string, value: T) => void
): T {
  logger?.(checkpoint, value);
  
  // In development, also console.log for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔺 MCP Checkpoint [${checkpoint}]:`, value);
  }
  
  return value;
}

/**
 * Creates a progress tracker for multi-step flows
 */
export class MCPProgress {
  private steps: string[] = [];
  private current = 0;
  
  constructor(private onProgress?: (progress: number, step: string) => void) {}
  
  addStep(step: string): this {
    this.steps.push(step);
    return this;
  }
  
  next(stepName?: string): this {
    this.current = Math.min(this.current + 1, this.steps.length);
    const currentStep = stepName || this.steps[this.current - 1] || 'Unknown';
    const progress = this.current / this.steps.length;
    
    this.onProgress?.(progress, currentStep);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔺 MCP Progress: ${Math.round(progress * 100)}% - ${currentStep}`);
    }
    
    return this;
  }
  
  getProgress(): number {
    return this.current / this.steps.length;
  }
}

// ========================
// 🧩 COMPOSABLE PATTERNS
// ========================

/**
 * Creates a smooth state transition with momentum preservation
 */
export function createSmoothTransition<T>(
  initialState: T,
  transitionFn: (prev: T, next: T) => T = (_, next) => next
) {
  let currentState = initialState;
  
  return {
    getCurrentState: () => currentState,
    transition: (nextState: T) => {
      currentState = transitionFn(currentState, nextState);
      return currentState;
    },
    reset: () => {
      currentState = initialState;
      return currentState;
    }
  };
}

/**
 * Wraps a component/function to follow MCP principles
 */
export function withMCP<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    preserveMomentum?: boolean;
    gracefulErrors?: boolean;
    checkpoints?: string[];
    logger?: (message: string, data?: any) => void;
  } = {}
): T {
  const { preserveMomentum = true, gracefulErrors = true, checkpoints = [], logger } = options;
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const startTime = Date.now();
    
    try {
      // Log start checkpoint
      if (checkpoints.includes('start')) {
        logger?.('🔺 MCP Start', { args, timestamp: startTime });
      }
      
      const result = fn(...args);
      
      // Log success checkpoint
      if (checkpoints.includes('success')) {
        logger?.('🔺 MCP Success', { 
          result, 
          duration: Date.now() - startTime 
        });
      }
      
      return result;
      
    } catch (error) {
      // Log error checkpoint
      if (checkpoints.includes('error')) {
        logger?.('🔺 MCP Error', { 
          error, 
          args, 
          duration: Date.now() - startTime 
        });
      }
      
      if (gracefulErrors) {
        // Return a graceful fallback based on expected return type
        return undefined as ReturnType<T>;
      } else {
        throw error;
      }
    }
  }) as T;
}

// ========================
// 🎛️ MCP VALIDATION
// ========================

/**
 * Validates that a solution follows MCP principles
 */
export interface MCPValidation {
  curvatureScore: number;     // 0-10, lower is better
  momentumScore: number;      // 0-10, higher is better  
  optionalityScore: number;   // 0-10, higher is better
  gracefulnessScore: number;  // 0-10, higher is better
  overallScore: number;       // 0-10, higher is better
  suggestions: string[];
}

export function validateMCP(solution: {
  componentCount?: number;
  stateTransitions?: number;
  errorHandlers?: number;
  rollbackOptions?: number;
  testability?: number;
}): MCPValidation {
  const {
    componentCount = 1,
    stateTransitions = 1,
    errorHandlers = 0,
    rollbackOptions = 0,
    testability = 5
  } = solution;
  
  // Score calculations (0-10)
  const curvatureScore = Math.max(0, 10 - componentCount * 0.5 - stateTransitions * 0.3);
  const momentumScore = Math.min(10, rollbackOptions * 2 + testability);
  const optionalityScore = Math.min(10, rollbackOptions * 1.5 + testability * 0.8);
  const gracefulnessScore = Math.min(10, errorHandlers * 2.5);
  
  const overallScore = (curvatureScore + momentumScore + optionalityScore + gracefulnessScore) / 4;
  
  const suggestions: string[] = [];
  if (curvatureScore < 7) suggestions.push("Consider reducing component complexity");
  if (momentumScore < 7) suggestions.push("Add more rollback options and tests");
  if (optionalityScore < 7) suggestions.push("Increase future extensibility");
  if (gracefulnessScore < 7) suggestions.push("Add more error handling");
  
  return {
    curvatureScore,
    momentumScore,
    optionalityScore,
    gracefulnessScore,
    overallScore,
    suggestions
  };
}

// Export convenience functions
export const MCP = {
  withMomentum,
  withGracefulError,
  mcpDecision,
  withCheckpoint,
  createSmoothTransition,
  withMCP,
  validateMCP,
  preserveFlow,
  createErrorState,
  Progress: MCPProgress
};

export default MCP;
