import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Droitguinéen API',
      version: '1.0.0',
      description: `
API REST pour la plateforme juridique Droitguinéen.

Cette API permet de:
- Consulter et rechercher les textes juridiques guinéens
- Uploader et traiter des documents PDF
- Gérer les relations entre textes (abrogation, modification, etc.)
- Exporter les textes en différents formats

## Authentification
L'API utilise JWT (JSON Web Tokens) pour l'authentification.
- **Routes publiques** : GET /lois, GET /recherche, GET /relations, GET /export (lecture seule)
- **Routes protégées** : POST/PUT/DELETE sur /lois, /upload, /relations (nécessitent un token Bearer)
- **Routes admin** : Gestion des utilisateurs via /auth/users (rôle ADMIN requis)

Pour obtenir un token : POST /auth/login avec email/password.
Inclure le token dans le header : \`Authorization: Bearer <token>\`

## Rôles
- **ADMIN** : Accès complet (CRUD textes, gestion utilisateurs)
- **EDITOR** : Création et modification de textes
- **USER** : Lecture seule (routes publiques)

## Rate Limiting
- Auth: 10 requêtes / 15 minutes
- Général: 100 requêtes / 15 minutes
- Recherche: 30 requêtes / minute
- Upload: 20 requêtes / heure
- Export: 50 requêtes / heure
      `,
      contact: {
        name: 'Support Technique',
        email: 'support@droitguineen.gn',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Serveur de développement',
      },
      {
        url: 'https://api.droitguineen.gn',
        description: 'Serveur de production',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentification et gestion des utilisateurs' },
      { name: 'Lois', description: 'Gestion des textes juridiques' },
      { name: 'Recherche', description: 'Recherche full-text' },
      { name: 'Upload', description: 'Upload et traitement de PDF' },
      { name: 'Relations', description: 'Relations entre textes' },
      { name: 'Export', description: 'Export de documents' },
    ],
    components: {
      schemas: {
        Texte: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cid: { type: 'string', description: 'Common Identifier' },
            nor: { type: 'string', description: 'Numéro d\'ordre (12 caractères)' },
            eli: { type: 'string', format: 'uri', description: 'European Legislation Identifier' },
            titre: { type: 'string' },
            titreComplet: { type: 'string' },
            nature: { $ref: '#/components/schemas/Nature' },
            numero: { type: 'string' },
            dateSignature: { type: 'string', format: 'date-time' },
            datePublication: { type: 'string', format: 'date-time' },
            etat: { $ref: '#/components/schemas/EtatTexte' },
            visas: { type: 'string' },
            signataires: { type: 'string' },
            sourceJO: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Nature: {
          type: 'string',
          enum: [
            'LOI', 'LOI_ORGANIQUE', 'LOI_CONSTITUTIONNELLE', 'ORDONNANCE',
            'DECRET', 'DECRET_LOI', 'ARRETE', 'CIRCULAIRE', 'DECISION',
            'CONVENTION', 'TRAITE', 'CODE', 'JURISPRUDENCE', 'AUTRE',
          ],
        },
        EtatTexte: {
          type: 'string',
          enum: ['VIGUEUR', 'VIGUEUR_DIFF', 'MODIFIE', 'ABROGE', 'ABROGE_DIFF', 'PERIME'],
        },
        TypeRelation: {
          type: 'string',
          enum: [
            'ABROGE', 'ABROGE_PARTIELLEMENT', 'MODIFIE', 'COMPLETE', 'CITE',
            'APPLIQUE', 'PROROGE', 'SUSPEND', 'RATIFIE', 'CODIFIE', 'CONSOLIDE',
          ],
        },
        Article: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cid: { type: 'string' },
            numero: { type: 'string' },
            contenu: { type: 'string' },
            etat: { type: 'string', enum: ['VIGUEUR', 'VIGUEUR_DIFF', 'MODIFIE', 'ABROGE', 'PERIME'] },
            ordre: { type: 'integer' },
          },
        },
        Relation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { $ref: '#/components/schemas/TypeRelation' },
            texteSourceId: { type: 'string', format: 'uuid' },
            texteCibleId: { type: 'string', format: 'uuid' },
            articleCibleNum: { type: 'string' },
            description: { type: 'string' },
            dateEffet: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via POST /auth/login',
        },
      },
      responses: {
        Unauthorized: {
          description: 'Token manquant ou invalide',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Forbidden: {
          description: 'Permissions insuffisantes',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        BadRequest: {
          description: 'Requête invalide',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        TooManyRequests: {
          description: 'Trop de requêtes',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string' },
                  retryAfter: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/docs/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
