/**
 * Runtime Validation System
 * Provides comprehensive runtime type checking and validation for enterprise-grade type safety
 */

import { z } from 'zod';

/**
 * Type for environment warnings input - allows undefined values
 */
interface EnvironmentWarningsInput {
  NODE_ENV?: 'development' | 'production' | 'test' | undefined;
  DEEPSEEK_API_KEY?: string | undefined;
  PROM_ENABLED?: string | undefined;
  NEXT_TELEMETRY_DISABLED?: string | undefined;
}

/**
 * DeepSeek API Request Validation Schema
 */
export const DeepSeekRequestSchema = z.object({
  model: z.enum(['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner']),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().min(1).max(200000),
  })).min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(32000).optional(),
  stream: z.boolean().optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
});

/**
 * Template Configuration Validation Schema
 */
export const TemplateConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  scenario: z.enum(['code', 'writing', 'analysis', 'creative', 'business', 'academic', 'web']),
  language: z.enum(['zh', 'en']),
  mode: z.enum(['detailed', 'concise']),
  spec: z.object({
    systemPrompt: z.string().min(1),
    userPromptTemplate: z.string().min(1),
    outputFormat: z.string().optional(),
    examples: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
  }),
  metadata: z.object({
    author: z.string().optional(),
    version: z.string().optional(),
    tags: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  }).optional(),
});

/**
 * CSRF Token Validation Schema
 */
export const CSRFTokenSchema = z.object({
  token: z.string().min(32).max(64),
  expires: z.number().min(Date.now()),
});

/**
 * API Response Validation Schema
 */
export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  code: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

/**
 * Environment Variables Validation Schema
 */
export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DEEPSEEK_API_KEY: z.string().startsWith('sk-').optional(),
  NEXT_TELEMETRY_DISABLED: z.string().optional(),
  PROM_ENABLED: z.string().optional(),
});

/**
 * Runtime Validator Class
 */
export class RuntimeValidator {
  /**
   * Validate DeepSeek API request
   */
  static validateDeepSeekRequest(data: unknown): {
    success: boolean;
    data?: z.infer<typeof DeepSeekRequestSchema>;
    errors?: string[];
  } {
    try {
      const validated = DeepSeekRequestSchema.parse(data);
      return { success: true, data: validated };
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return { success: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Validate template configuration
   */
  static validateTemplateConfig(data: unknown): {
    success: boolean;
    data?: z.infer<typeof TemplateConfigSchema>;
    errors?: string[];
    warnings?: string[];
  } {
    try {
      const validated = TemplateConfigSchema.parse(data);
      const warnings = this.generateTemplateWarnings(validated);
      return { success: true, data: validated, warnings };
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return { success: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Validate CSRF token
   */
  static validateCSRFTokenData(data: unknown): {
    success: boolean;
    data?: z.infer<typeof CSRFTokenSchema>;
    errors?: string[];
  } {
    try {
      const validated = CSRFTokenSchema.parse(data);

      // Additional runtime checks
      if (validated.expires <= Date.now()) {
        return { success: false, errors: ['Token has expired'] };
      }

      return { success: true, data: validated };
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return { success: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Validate API response structure
   */
  static validateAPIResponse(data: unknown): {
    success: boolean;
    data?: z.infer<typeof APIResponseSchema>;
    errors?: string[];
  } {
    try {
      const validated = APIResponseSchema.parse(data);
      return { success: true, data: validated };
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return { success: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Validate environment variables
   */
  static validateEnvironment(): {
    success: boolean;
    data?: z.infer<typeof EnvironmentSchema>;
    errors?: string[];
    warnings?: string[];
  } {
    try {
      const validated = EnvironmentSchema.partial().parse(process.env);
      // Cast to the expected type for generateEnvironmentWarnings
      const envForWarnings: EnvironmentWarningsInput = {
        NODE_ENV: validated.NODE_ENV,
        DEEPSEEK_API_KEY: validated.DEEPSEEK_API_KEY,
        PROM_ENABLED: validated.PROM_ENABLED,
        NEXT_TELEMETRY_DISABLED: validated.NEXT_TELEMETRY_DISABLED,
      };
      const warnings = this.generateEnvironmentWarnings(envForWarnings);
      return { success: true, data: validated as z.infer<typeof EnvironmentSchema>, warnings };
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return { success: false, errors: ['Unknown validation error'] };
    }
  }

  /**
   * Generate template configuration warnings
   */
  private static generateTemplateWarnings(template: z.infer<typeof TemplateConfigSchema>): string[] {
    const warnings: string[] = [];

    // Check for missing metadata
    if (!template.metadata) {
      warnings.push('Template metadata is missing - consider adding author, version, and tags');
    }

    // Check for short descriptions
    if (template.description.length < 20) {
      warnings.push('Template description is quite short - consider adding more detail');
    }

    // Check for missing examples
    if (!template.spec.examples || template.spec.examples.length === 0) {
      warnings.push('Template has no examples - consider adding usage examples');
    }

    // Check for missing constraints
    if (!template.spec.constraints || template.spec.constraints.length === 0) {
      warnings.push('Template has no constraints - consider adding usage constraints');
    }

    return warnings;
  }

  /**
   * Generate environment warnings
   */
  private static generateEnvironmentWarnings(env: EnvironmentWarningsInput): string[] {
    const warnings: string[] = [];

    // Check for missing API key in production
    if (env.NODE_ENV === 'production' && !env.DEEPSEEK_API_KEY) {
      warnings.push('DEEPSEEK_API_KEY is not set in production environment');
    }

    // Check for telemetry settings
    if (env.NEXT_TELEMETRY_DISABLED !== '1') {
      warnings.push('Next.js telemetry is enabled - consider disabling for privacy');
    }

    // Check for monitoring settings
    if (env.NODE_ENV === 'production' && env.PROM_ENABLED !== 'true') {
      warnings.push('Prometheus metrics are disabled in production - consider enabling for monitoring');
    }

    return warnings;
  }
}

/**
 * Type-safe assertion function
 */
export function assertType<T>(
  value: unknown,
  schema: z.ZodSchema<T>,
  errorMessage?: string
): asserts value is T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const errors = result.error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
    throw new TypeError(errorMessage || `Type assertion failed: ${errors.join(', ')}`);
  }
}

/**
 * Safe type casting with validation
 */
export function safeCast<T>(
  value: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors = result.error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
    return { success: false, error: errors.join(', ') };
  }
}

/**
 * Runtime type guard generator
 */
export function createTypeGuard<T>(schema: z.ZodSchema<T>) {
  return (value: unknown): value is T => {
    return schema.safeParse(value).success;
  };
}

// Export type guards for common schemas
export const isDeepSeekRequest = createTypeGuard(DeepSeekRequestSchema);
export const isTemplateConfig = createTypeGuard(TemplateConfigSchema);
export const isCSRFToken = createTypeGuard(CSRFTokenSchema);
export const isAPIResponse = createTypeGuard(APIResponseSchema);

/**
 * Validation middleware for API routes
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (validatedData: T, request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    try {
      const body = await request.json();
      const validation = safeCast(body, schema);
      
      if (!validation.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Validation failed',
            details: validation.error,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      return await handler(validation.data, request);
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON or server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
