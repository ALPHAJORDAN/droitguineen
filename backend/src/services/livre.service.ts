import { livreRepository, FindAllLivresOptions, CreateLivreData } from '../repositories/livre.repository';
import { AppError } from '../middlewares/error.middleware';
import { Prisma } from '@prisma/client';

class LivreService {
  async findAll(options: FindAllLivresOptions) {
    const { livres, total } = await livreRepository.findAll(options);
    return {
      data: livres,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.max(1, Math.ceil(total / options.limit)),
    };
  }

  async findById(id: string) {
    const livre = await livreRepository.findById(id);
    if (!livre) {
      throw new AppError(404, 'Livre non trouvé');
    }
    return livre;
  }

  async create(data: CreateLivreData) {
    return livreRepository.create(data);
  }

  async update(id: string, data: Prisma.LivreUpdateInput) {
    const exists = await livreRepository.findById(id);
    if (!exists) {
      throw new AppError(404, 'Livre non trouvé');
    }
    return livreRepository.update(id, data);
  }

  async delete(id: string) {
    const exists = await livreRepository.findById(id);
    if (!exists) {
      throw new AppError(404, 'Livre non trouvé');
    }
    return livreRepository.delete(id);
  }

  async getStats() {
    return livreRepository.getStats();
  }
}

export const livreService = new LivreService();
export default livreService;
