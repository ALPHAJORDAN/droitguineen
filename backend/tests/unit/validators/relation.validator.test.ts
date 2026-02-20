import { describe, it, expect } from 'vitest';
import {
  createRelationSchema,
  updateRelationSchema,
  TypeRelationEnum,
} from '../../../src/validators/relation.validator';

describe('Relation Validators', () => {
  describe('createRelationSchema', () => {
    it('should validate a valid relation', () => {
      const validRelation = {
        type: 'MODIFIE',
        texteSourceId: '550e8400-e29b-41d4-a716-446655440000',
        texteCibleId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = createRelationSchema.safeParse(validRelation);
      expect(result.success).toBe(true);
    });

    it('should validate relation with all optional fields', () => {
      const fullRelation = {
        type: 'ABROGE',
        texteSourceId: '550e8400-e29b-41d4-a716-446655440000',
        texteCibleId: '550e8400-e29b-41d4-a716-446655440001',
        articleCibleNum: 'Article 5',
        articleSourceNum: 'Article 1',
        description: 'Cette loi abroge les dispositions précédentes',
        dateEffet: '2024-01-01T00:00:00.000Z',
      };

      const result = createRelationSchema.safeParse(fullRelation);
      expect(result.success).toBe(true);
    });

    it('should reject relation without type', () => {
      const invalidRelation = {
        texteSourceId: '550e8400-e29b-41d4-a716-446655440000',
        texteCibleId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = createRelationSchema.safeParse(invalidRelation);
      expect(result.success).toBe(false);
    });

    it('should reject invalid type', () => {
      const invalidRelation = {
        type: 'INVALID_TYPE',
        texteSourceId: '550e8400-e29b-41d4-a716-446655440000',
        texteCibleId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = createRelationSchema.safeParse(invalidRelation);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID for texteSourceId', () => {
      const invalidRelation = {
        type: 'MODIFIE',
        texteSourceId: 'not-a-uuid',
        texteCibleId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = createRelationSchema.safeParse(invalidRelation);
      expect(result.success).toBe(false);
    });

    it('should reject self-reference (same source and target)', () => {
      const selfReference = {
        type: 'MODIFIE',
        texteSourceId: '550e8400-e29b-41d4-a716-446655440000',
        texteCibleId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createRelationSchema.safeParse(selfReference);
      expect(result.success).toBe(false);
    });
  });

  describe('updateRelationSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        description: 'Updated description',
      };

      const result = updateRelationSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const result = updateRelationSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate type if provided', () => {
      const update = {
        type: 'CITE',
      };

      const result = updateRelationSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should reject invalid type', () => {
      const update = {
        type: 'INVALID',
      };

      const result = updateRelationSchema.safeParse(update);
      expect(result.success).toBe(false);
    });
  });

  describe('TypeRelationEnum', () => {
    it('should accept all valid relation types', () => {
      const validTypes = [
        'ABROGE',
        'ABROGE_PARTIELLEMENT',
        'MODIFIE',
        'COMPLETE',
        'CITE',
        'APPLIQUE',
        'PROROGE',
        'SUSPEND',
        'RATIFIE',
        'CODIFIE',
        'CONSOLIDE',
      ];

      validTypes.forEach((type) => {
        const result = TypeRelationEnum.safeParse(type);
        expect(result.success).toBe(true);
      });
    });
  });
});
