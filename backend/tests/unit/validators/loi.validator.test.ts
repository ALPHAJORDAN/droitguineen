import { describe, it, expect } from 'vitest';
import {
  createLoiSchema,
  updateLoiSchema,
  paginationSchema,
  searchSchema,
  NatureEnum,
  EtatTexteEnum,
} from '../../../src/validators/loi.validator';

describe('Loi Validators', () => {
  describe('createLoiSchema', () => {
    it('should validate a valid loi with required fields', () => {
      const validLoi = {
        cid: 'LEGITEXT000123456789',
        titre: 'Loi relative au Code civil de Guinée',
        nature: 'LOI',
      };

      const result = createLoiSchema.safeParse(validLoi);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cid).toBe(validLoi.cid);
        expect(result.data.titre).toBe(validLoi.titre);
        expect(result.data.nature).toBe('LOI');
        expect(result.data.etat).toBe('VIGUEUR'); // default value
      }
    });

    it('should validate a loi with all optional fields', () => {
      const fullLoi = {
        cid: 'LEGITEXT000123456789',
        nor: 'ABCD1234567X',
        eli: 'https://droitguineen.gn/eli/loi/2024/123',
        titre: 'Loi organique relative à la justice',
        titreComplet: 'Loi organique n°2024-123 relative à la justice',
        nature: 'LOI_ORGANIQUE',
        numero: '2024-123',
        dateSignature: '2024-01-15T00:00:00.000Z',
        datePublication: '2024-01-20T00:00:00.000Z',
        etat: 'VIGUEUR',
        visas: 'Vu la Constitution...',
        signataires: 'Le Président de la République',
        sourceJO: 'JO n°123 du 20/01/2024',
        sousCategorie: 'organiques',
      };

      const result = createLoiSchema.safeParse(fullLoi);
      expect(result.success).toBe(true);
    });

    it('should reject loi without cid', () => {
      const invalidLoi = {
        titre: 'Test',
        nature: 'LOI',
      };

      const result = createLoiSchema.safeParse(invalidLoi);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('cid');
      }
    });

    it('should reject loi with invalid nature', () => {
      const invalidLoi = {
        cid: 'TEST123',
        titre: 'Test loi',
        nature: 'INVALID_NATURE',
      };

      const result = createLoiSchema.safeParse(invalidLoi);
      expect(result.success).toBe(false);
    });

    it('should reject loi with short titre', () => {
      const invalidLoi = {
        cid: 'TEST123',
        titre: 'AB', // Too short (min 3)
        nature: 'LOI',
      };

      const result = createLoiSchema.safeParse(invalidLoi);
      expect(result.success).toBe(false);
    });

    it('should reject invalid NOR format', () => {
      const invalidLoi = {
        cid: 'TEST123',
        titre: 'Test loi valide',
        nature: 'LOI',
        nor: 'ABC', // Should be 12 characters
      };

      const result = createLoiSchema.safeParse(invalidLoi);
      expect(result.success).toBe(false);
    });

    it('should accept valid articles', () => {
      const loiWithArticles = {
        cid: 'TEST123',
        titre: 'Loi avec articles',
        nature: 'LOI',
        articles: [
          { numero: '1', contenu: 'Premier article de la loi avec contenu suffisant.' },
          { numero: '2', contenu: 'Deuxième article de la loi avec contenu suffisant.' },
        ],
      };

      const result = createLoiSchema.safeParse(loiWithArticles);
      expect(result.success).toBe(true);
    });
  });

  describe('updateLoiSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        titre: 'Nouveau titre de la loi',
        etat: 'MODIFIE',
      };

      const result = updateLoiSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow empty object for no changes', () => {
      const result = updateLoiSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('paginationSchema', () => {
    it('should provide default values', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sort).toBe('datePublication');
        expect(result.data.order).toBe('desc');
      }
    });

    it('should coerce string numbers', () => {
      const result = paginationSchema.safeParse({
        page: '5',
        limit: '50',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject limit over 100', () => {
      const result = paginationSchema.safeParse({
        limit: '500',
      });

      expect(result.success).toBe(false);
    });

    it('should reject page less than 1', () => {
      const result = paginationSchema.safeParse({
        page: '0',
      });

      expect(result.success).toBe(false);
    });

    it('should accept valid nature filter', () => {
      const result = paginationSchema.safeParse({
        nature: 'DECRET',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nature).toBe('DECRET');
      }
    });
  });

  describe('searchSchema', () => {
    it('should validate search query', () => {
      const result = searchSchema.safeParse({
        q: 'code civil',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe('code civil');
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should reject empty query', () => {
      const result = searchSchema.safeParse({
        q: '',
      });

      expect(result.success).toBe(false);
    });

    it('should accept filters with search', () => {
      const result = searchSchema.safeParse({
        q: 'constitution',
        nature: 'LOI_CONSTITUTIONNELLE',
        etat: 'VIGUEUR',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('NatureEnum', () => {
    it('should accept all valid nature values', () => {
      const validNatures = [
        'LOI', 'LOI_ORGANIQUE', 'LOI_CONSTITUTIONNELLE', 'ORDONNANCE',
        'DECRET', 'DECRET_LOI', 'ARRETE', 'CIRCULAIRE', 'DECISION',
        'CONVENTION', 'TRAITE', 'CODE', 'JURISPRUDENCE', 'AUTRE',
      ];

      validNatures.forEach((nature) => {
        const result = NatureEnum.safeParse(nature);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('EtatTexteEnum', () => {
    it('should accept all valid etat values', () => {
      const validEtats = [
        'VIGUEUR', 'VIGUEUR_DIFF', 'MODIFIE', 'ABROGE', 'ABROGE_DIFF', 'PERIME',
      ];

      validEtats.forEach((etat) => {
        const result = EtatTexteEnum.safeParse(etat);
        expect(result.success).toBe(true);
      });
    });
  });
});
