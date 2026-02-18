import { describe, it, expect, vi, beforeEach } from 'vitest';
import { texteService } from '../../../src/services/texte.service';
import { texteRepository } from '../../../src/repositories/texte.repository';
import { AppError } from '../../../src/middlewares/error.middleware';

// Mock the repository
vi.mock('../../../src/repositories/texte.repository', () => ({
  texteRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByCid: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    existsByCid: vi.fn(),
  },
}));

// Mock meilisearch
vi.mock('../../../src/lib/meilisearch', () => ({
  indexTexte: vi.fn().mockResolvedValue(undefined),
  removeTexteFromIndex: vi.fn().mockResolvedValue(undefined),
}));

describe('TexteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated list of textes', async () => {
      const mockTextes = [
        { id: '1', cid: 'CID1', titre: 'Loi 1', nature: 'LOI' },
        { id: '2', cid: 'CID2', titre: 'Loi 2', nature: 'LOI' },
      ];

      vi.mocked(texteRepository.findAll).mockResolvedValue({
        textes: mockTextes,
        total: 2,
      });

      const result = await texteService.findAll({
        page: 1,
        limit: 20,
        sort: 'datePublication',
        order: 'desc',
      });

      expect(result.data).toEqual(mockTextes);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
      expect(texteRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sort: 'datePublication',
        order: 'desc',
      });
    });

    it('should calculate totalPages correctly', async () => {
      vi.mocked(texteRepository.findAll).mockResolvedValue({
        textes: [],
        total: 45,
      });

      const result = await texteService.findAll({
        page: 1,
        limit: 20,
        sort: 'datePublication',
        order: 'desc',
      });

      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('findById', () => {
    it('should return texte when found', async () => {
      const mockTexte = {
        id: '1',
        cid: 'CID1',
        titre: 'Loi test',
        nature: 'LOI',
        articles: [
          { numero: '2', contenu: 'Article 2' },
          { numero: '1', contenu: 'Article 1' },
        ],
        sections: [],
      };

      vi.mocked(texteRepository.findById).mockResolvedValue(mockTexte as any);

      const result = await texteService.findById('1');

      expect(result.id).toBe('1');
      expect(texteRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should sort articles by number', async () => {
      const mockTexte = {
        id: '1',
        articles: [
          { numero: '10', contenu: 'Article 10' },
          { numero: '2', contenu: 'Article 2' },
          { numero: '1', contenu: 'Article 1' },
        ],
        sections: [],
      };

      vi.mocked(texteRepository.findById).mockResolvedValue(mockTexte as any);

      const result = await texteService.findById('1');

      expect(result.articles[0].numero).toBe('1');
      expect(result.articles[1].numero).toBe('2');
      expect(result.articles[2].numero).toBe('10');
    });

    it('should throw AppError when texte not found', async () => {
      vi.mocked(texteRepository.findById).mockResolvedValue(null);

      await expect(texteService.findById('nonexistent')).rejects.toThrow(AppError);
      await expect(texteService.findById('nonexistent')).rejects.toThrow('Texte non trouvé');
    });
  });

  describe('create', () => {
    it('should create texte successfully', async () => {
      const createData = {
        cid: 'NEW-CID',
        titre: 'Nouvelle loi',
        nature: 'LOI' as const,
      };

      const mockCreatedTexte = {
        id: 'new-id',
        ...createData,
        articles: [],
      };

      vi.mocked(texteRepository.existsByCid).mockResolvedValue(false);
      vi.mocked(texteRepository.create).mockResolvedValue(mockCreatedTexte as any);

      const result = await texteService.create(createData);

      expect(result.cid).toBe('NEW-CID');
      expect(texteRepository.create).toHaveBeenCalledWith(createData);
    });

    it('should throw error if CID already exists', async () => {
      vi.mocked(texteRepository.existsByCid).mockResolvedValue(true);

      await expect(
        texteService.create({
          cid: 'EXISTING-CID',
          titre: 'Test',
          nature: 'LOI' as const,
        })
      ).rejects.toThrow(AppError);

      expect(texteRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update texte successfully', async () => {
      const updateData = { titre: 'Updated titre' };
      const mockUpdatedTexte = {
        id: '1',
        cid: 'CID1',
        titre: 'Updated titre',
        articles: [],
      };

      vi.mocked(texteRepository.exists).mockResolvedValue(true);
      vi.mocked(texteRepository.update).mockResolvedValue(mockUpdatedTexte as any);

      const result = await texteService.update('1', updateData);

      expect(result.titre).toBe('Updated titre');
      expect(texteRepository.update).toHaveBeenCalled();
    });

    it('should throw error if texte not found', async () => {
      vi.mocked(texteRepository.exists).mockResolvedValue(false);

      await expect(texteService.update('nonexistent', { titre: 'Test' })).rejects.toThrow(
        AppError
      );

      expect(texteRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete texte successfully', async () => {
      vi.mocked(texteRepository.exists).mockResolvedValue(true);
      vi.mocked(texteRepository.delete).mockResolvedValue(undefined as any);

      await texteService.delete('1');

      expect(texteRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error if texte not found', async () => {
      vi.mocked(texteRepository.exists).mockResolvedValue(false);

      await expect(texteService.delete('nonexistent')).rejects.toThrow(AppError);
      expect(texteRepository.delete).not.toHaveBeenCalled();
    });
  });
});
