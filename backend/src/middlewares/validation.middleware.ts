import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './error.middleware';

type ZodSchema = z.ZodType<any, any, any>;

type ValidationSource = 'body' | 'query' | 'params';

/**
 * Validation middleware factory using Zod schemas
 * @param schema - Zod schema to validate against
 * @param source - Where to find the data to validate (body, query, params)
 */
export function validate(schema: ZodSchema, source: ValidationSource = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await schema.parseAsync(req[source]);
      // Replace with validated and transformed data
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Erreur de validation',
          details: error.issues.map((e: z.ZodIssue) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Validate multiple sources at once
 */
export function validateMultiple(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: Array<{ source: string; field: string; message: string }> = [];

    for (const [source, schema] of Object.entries(schemas)) {
      if (schema) {
        try {
          const data = await schema.parseAsync(req[source as ValidationSource]);
          req[source as ValidationSource] = data;
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(
              ...error.issues.map((e: z.ZodIssue) => ({
                source,
                field: e.path.join('.'),
                message: e.message,
              }))
            );
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Erreur de validation',
        details: errors,
      });
    }

    next();
  };
}

/**
 * Validate request ID parameter
 */
export function validateId(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];

    if (!id) {
      return res.status(400).json({
        success: false,
        error: `Paramètre ${paramName} requis`,
      });
    }

    // Check if it's a valid UUID or CUID format
    // Note: Some legacy or imported IDs might have longer suffixes (e.g. 16 chars)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12,16}$/i;
    const cuidRegex = /^c[a-z0-9]{24,}$/;

    if (!uuidRegex.test(id) && !cuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: `Format d'identifiant invalide`,
      });
    }

    next();
  };
}
