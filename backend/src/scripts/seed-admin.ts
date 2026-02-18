/**
 * Script de création du premier utilisateur administrateur.
 * Usage: npx tsx src/scripts/seed-admin.ts
 *
 * Variables d'environnement optionnelles :
 *   ADMIN_EMAIL    (défaut: admin@leguinee.gn)
 *   ADMIN_PASSWORD (défaut: Admin123!)
 *   ADMIN_NOM      (défaut: Administrateur)
 *   ADMIN_PRENOM   (défaut: Système)
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';

const BCRYPT_ROUNDS = 12;

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@leguinee.gn';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const nom = process.env.ADMIN_NOM || 'Administrateur';
  const prenom = process.env.ADMIN_PRENOM || 'Système';

  console.log(`Création de l'administrateur : ${email}`);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('Un utilisateur avec cet email existe déjà.');
    console.log(`  ID: ${existing.id}`);
    console.log(`  Rôle: ${existing.role}`);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      nom,
      prenom,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Administrateur créé avec succès !');
  console.log(`  ID: ${user.id}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Rôle: ${user.role}`);
  console.log('');
  console.log('⚠ Changez le mot de passe par défaut en production !');

  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error('Erreur lors de la création de l\'administrateur:', error);
  process.exit(1);
});
