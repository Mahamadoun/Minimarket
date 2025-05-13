require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');

// Initialisation de l'application Express
const app = express();
const port = process.env.PORT || 3000;

// Configuration de la base de données PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware pour traiter les données JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration de la session
app.use(session({
    store: new PgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'mini-market-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
}));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Initialisation de la base de données
async function initDatabase() {
    try {
        // Créer les tables si elles n'existent pas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                is_admin INTEGER DEFAULT 0,
                is_super_admin INTEGER DEFAULT 0,
                last_login TIMESTAMP
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                description TEXT
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price NUMERIC(10, 2) NOT NULL,
                image_url TEXT NOT NULL,
                category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS session (
                sid VARCHAR NOT NULL COLLATE "default",
                sess JSON NOT NULL,
                expire TIMESTAMP(6) NOT NULL,
                CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
            )
        `);
        
        // Vérifier s'il existe déjà un super admin
        const superAdminResult = await pool.query('SELECT * FROM users WHERE is_super_admin = 1 LIMIT 1');
        
        if (superAdminResult.rows.length === 0) {
            // Créer un super admin par défaut
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                'INSERT INTO users (username, password, is_admin, is_super_admin) VALUES ($1, $2, $3, $4)',
                ['admin', hashedPassword, 1, 1]
            );
            console.log('Super admin créé avec les identifiants par défaut: admin / admin123');
        }
        
        // Vérifier s'il existe déjà des catégories
        const categoriesResult = await pool.query('SELECT * FROM categories LIMIT 1');
        
        if (categoriesResult.rows.length === 0) {
            // Créer des catégories par défaut
            const defaultCategories = [
                { name: 'Épicerie', slug: 'epicerie', description: 'Produits alimentaires de base et épicerie' },
                { name: 'Boissons', slug: 'boissons', description: 'Boissons gazeuses, jus, eau et autres' },
                { name: 'Produits Frais', slug: 'produits-frais', description: 'Fruits, légumes et autres produits frais' },
                { name: 'Hygiène', slug: 'hygiene', description: 'Produits d\'hygiène personnelle et maison' }
            ];
            
            for (const category of defaultCategories) {
                await pool.query(
                    'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)',
                    [category.name, category.slug, category.description]
                );
            }
            console.log('Catégories par défaut créées');
        }
        
        // Vérifier s'il existe déjà des produits
        const productsResult = await pool.query('SELECT * FROM products LIMIT 1');
        
        if (productsResult.rows.length === 0) {
            // Créer des produits par défaut
            const defaultProducts = [
                {
                    name: 'Riz Premium',
                    description: 'Riz de qualité supérieure, parfait pour accompagner tous vos plats.',
                    price: 2500,
                    imageUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8Z3JvY2VyeXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
                    category_id: 1
                },
                {
                    name: 'Eau minérale (pack de 6)',
                    description: 'Pack de 6 bouteilles d\'eau minérale naturelle, 1.5L chacune.',
                    price: 1200,
                    imageUrl: 'https://images.unsplash.com/photo-1553530979-fbb9e4aee36f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8YmV2ZXJhZ2VzfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
                    category_id: 2
                },
                {
                    name: 'Légumes frais (assortiment)',
                    description: 'Assortiment de légumes frais de saison, cultivés localement.',
                    price: 1500,
                    imageUrl: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8ZnJlc2glMjBwcm9kdWNlfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
                    category_id: 3
                },
                {
                    name: 'Kit d\'hygiène personnel',
                    description: 'Kit complet d\'hygiène personnelle comprenant savon, shampoing et dentifrice.',
                    price: 3500,
                    imageUrl: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTJ8fHRvaWxldHJpZXN8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
                    category_id: 4
                },
                {
                    name: 'Pâtes alimentaires',
                    description: 'Pâtes de blé dur de haute qualité, parfaites pour vos plats italiens.',
                    price: 800,
                    imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fHBhc3RhfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
                    category_id: 1
                },
                {
                    name: 'Jus de fruits naturel',
                    description: 'Jus de fruits 100% naturel sans sucre ajouté ni conservateurs.',
                    price: 1800,
                    imageUrl: 'https://cdn.pixabay.com/photo/2016/07/21/11/17/drink-1532300_1280.jpg',
                    category_id: 2
                },
                {
                    name: 'Savon naturel',
                    description: 'Savon artisanal fabriqué à partir d\'ingrédients naturels et huiles essentielles.',
                    price: 750,
                    imageUrl: 'https://cdn.pixabay.com/photo/2017/11/08/19/39/soap-2931653_1280.jpg',
                    category_id: 4
                },
                {
                    name: 'Conserve de tomates',
                    description: 'Tomates pelées en conserve, idéales pour vos sauces et plats mijotés.',
                    price: 600,
                    imageUrl: 'https://images.unsplash.com/photo-1608835291093-394b0c943a75?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8Y2FubmVkJTIwZm9vZHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
                    category_id: 1
                }
            ];
            
            for (const product of defaultProducts) {
                await pool.query(
                    'INSERT INTO products (name, description, price, image_url, category_id) VALUES ($1, $2, $3, $4, $5)',
                    [product.name, product.description, product.price, product.imageUrl, product.category_Id]
                );
            }
            console.log('Produits par défaut créés');
        }
        
        console.log('Base de données initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
    }
}

// Middleware pour vérifier l'authentification
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Non authentifié' });
}

// Middleware pour vérifier les droits d'admin
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.isAdmin) {
        return next();
    }
    res.status(403).json({ success: false, message: 'Accès non autorisé' });
}

// Middleware pour vérifier les droits de super admin
function isSuperAdmin(req, res, next) {
    if (req.session.user && req.session.user.isSuperAdmin) {
        return next();
    }
    res.status(403).json({ success: false, message: 'Accès non autorisé' });
}

// Routes API

// Route d'authentification
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }
        
        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(400).json({ success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }
        
        // Mettre à jour la date de dernière connexion
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        
        // Créer la session
        req.session.user = {
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin === 1,
            isSuperAdmin: user.is_super_admin === 1
        };

        
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                isAdmin: user.is_admin,
                isSuperAdmin: user.is_super_admin
            }
        });
    } catch (error) {
        console.error('Erreur de connexion:', error);
        res.status(500).json({ success: false, message: 'Erreur de connexion' });
    }
});

// Route pour vérifier l'état de connexion actuel
app.get('/api/auth/me', (req, res) => {
    if (req.session.user) {
        res.json({
            id: req.session.user.id,
            username: req.session.user.username,
            isAdmin: req.session.user.isAdmin,
            isSuperAdmin: req.session.user.isSuperAdmin
        });
    } else {
        res.status(401).json({ success: false, message: 'Non authentifié' });
    }
});

// Route de déconnexion
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la déconnexion' });
        }
        res.json({ success: true, message: 'Déconnecté avec succès' });
    });
});

// Routes pour les catégories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des catégories' });
    }
});

app.get('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération de la catégorie:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la catégorie' });
    }
});

app.post('/api/categories', isAdmin, async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        
        // Validation
        if (!name || !slug) {
            return res.status(400).json({ success: false, message: 'Le nom et le slug sont requis' });
        }
        
        // Vérifier si le slug existe déjà
        const slugCheck = await pool.query('SELECT * FROM categories WHERE slug = $1', [slug]);
        
        if (slugCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Ce slug est déjà utilisé' });
        }
        
        const result = await pool.query(
            'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
            [name, slug, description]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la création de la catégorie:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la création de la catégorie' });
    }
});

app.put('/api/categories/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description } = req.body;
        
        // Validation
        if (!name || !slug) {
            return res.status(400).json({ success: false, message: 'Le nom et le slug sont requis' });
        }
        
        // Vérifier si le slug existe déjà pour une autre catégorie
        const slugCheck = await pool.query('SELECT * FROM categories WHERE slug = $1 AND id != $2', [slug, id]);
        
        if (slugCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Ce slug est déjà utilisé' });
        }
        
        const result = await pool.query(
            'UPDATE categories SET name = $1, slug = $2, description = $3 WHERE id = $4 RETURNING *',
            [name, slug, description, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la catégorie:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la catégorie' });
    }
});


app.delete('/api/categories/:id', isAdmin, async (req, res) => {
  const categoryId = req.params.id;

  try {
    // Étape 1 : Supprimer les produits liés à cette catégorie
    await pool.query('DELETE FROM products WHERE category_id = $1', [categoryId]);

    // Étape 2 : Supprimer la catégorie elle-même
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [categoryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }

    res.json({ success: true, message: 'Catégorie et produits supprimés avec succès' });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la catégorie :', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression' });
  }
});




// Routes pour les produits
app.get('/api/products', async (req, res) => {
    try {
        const { limit, category } = req.query;

        let query = 'SELECT * FROM products';
        const queryParams = [];

        if (category) {
            query += ' WHERE category_id = $1';
            queryParams.push(category);
        }

        query += ' ORDER BY id DESC';

        if (limit) {
            query += ' LIMIT $' + (queryParams.length + 1);
            queryParams.push(limit);
        }

        const result = await pool.query(query, queryParams);

        // Adapter les champs pour correspondre au frontend
        const formattedProducts = result.rows.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            categoryId: p.category_id,
            imageUrl: p.image_url
        }));

        res.json(formattedProducts);
    } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des produits' });
    }
});


app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération du produit:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du produit' });
    }
});

app.post('/api/products', isAdmin, async (req, res) => {
    try {
        const { name, description, price, imageUrl, categoryId } = req.body;

        if (!name || !price || !imageUrl) {
            return res.status(400).json({ success: false, message: 'Le nom, le prix et l\'URL de l\'image sont requis' });
        }

        const result = await pool.query(
            'INSERT INTO products (name, description, price, image_url, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, price, imageUrl, categoryId]
        );

        const p = result.rows[0];
        res.status(201).json({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            categoryId: p.category_id,
            imageUrl: p.image_url
        });
    } catch (error) {
        console.error('Erreur lors de la création du produit:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la création du produit' });
    }
});


app.put('/api/products/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, imageUrl, categoryId } = req.body;
        
        // Validation
        if (!name || !price || !imageUrl) {
            return res.status(400).json({ success: false, message: 'Le nom, le prix et l\'URL de l\'image sont requis' });
        }
        
        // Convertir le prix en nombre
        const numericPrice = parseFloat(price);
        
        if (isNaN(numericPrice)) {
            return res.status(400).json({ success: false, message: 'Le prix doit être un nombre valide' });
        }
        
        const result = await pool.query(
            'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, category_id = $5 WHERE id = $6 RETURNING *',
            [name, description, numericPrice, imageUrl, categoryId, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du produit:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du produit' });
    }
});

app.delete('/api/products/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Supprimer le produit et récupérer l'image_url
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const deletedProduct = result.rows[0];
    const imageUrl = deletedProduct.image_url;

    // Supprimer l'image associée si elle est dans /uploads/
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, 'public', imageUrl);
      
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.warn(`⚠️ Fichier image non supprimé : ${imagePath}`, err.message);
        } else {
          console.log(`🗑 Image supprimée : ${imagePath}`);
        }
      });
    }

    res.json({ success: true, message: 'Produit et image supprimés avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du produit' });
  }
});


// Routes pour les utilisateurs
app.get('/api/users', isSuperAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, is_admin, is_super_admin, last_login FROM users ORDER BY id');
        res.json(result.rows.map(user => ({
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin,
            isSuperAdmin: user.is_super_admin,
            lastLogin: user.last_login
        })));
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs' });
    }
});

app.get('/api/users/:id', isSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT id, username, is_admin, is_super_admin FROM users WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }
        
        const user = result.rows[0];
        res.json({
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin,
            isSuperAdmin: user.is_super_admin
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération de l\'utilisateur' });
    }
});

app.post('/api/users', isSuperAdmin, async (req, res) => {
    try {
        const { username, password, isAdmin, isSuperAdmin } = req.body;
        
        // Validation
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Le nom d\'utilisateur et le mot de passe sont requis' });
        }
        
        // Vérifier si le nom d'utilisateur existe déjà
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Ce nom d\'utilisateur est déjà utilisé' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            'INSERT INTO users (username, password, is_admin, is_super_admin) VALUES ($1, $2, $3, $4) RETURNING id, username, is_admin, is_super_admin',
            [username, hashedPassword, isAdmin ? 1 : 0, isSuperAdmin ? 1 : 0]
        );
        
        const user = result.rows[0];
        res.status(201).json({
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin,
            isSuperAdmin: user.is_super_admin
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'utilisateur' });
    }
});

app.put('/api/users/:id', isSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, isAdmin, isSuperAdmin } = req.body;
        
        // Validation
        if (!username) {
            return res.status(400).json({ success: false, message: 'Le nom d\'utilisateur est requis' });
        }
        
        // Vérifier si le nom d'utilisateur existe déjà pour un autre utilisateur
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1 AND id != $2', [username, id]);
        
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Ce nom d\'utilisateur est déjà utilisé' });
        }
        
        let query;
        let params;
        
        // Si un nouveau mot de passe est fourni, le hacher et le mettre à jour
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query = 'UPDATE users SET username = $1, password = $2, is_admin = $3, is_super_admin = $4 WHERE id = $5 RETURNING id, username, is_admin, is_super_admin';
            params = [username, hashedPassword, isAdmin ? 1 : 0, isSuperAdmin ? 1 : 0, id];
        } else {
            // Sinon, mettre à jour uniquement les autres champs
            query = 'UPDATE users SET username = $1, is_admin = $2, is_super_admin = $3 WHERE id = $4 RETURNING id, username, is_admin, is_super_admin';
            params = [username, isAdmin ? 1 : 0, isSuperAdmin ? 1 : 0, id];
        }
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }
        
        const user = result.rows[0];
        res.json({
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin,
            isSuperAdmin: user.is_super_admin
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l\'utilisateur' });
    }
});

app.delete('/api/users/:id', isSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const loggedInUserId = req.session.user.id;
        
        // Empêcher la suppression de son propre compte
        if (parseInt(id) === loggedInUserId) {
            return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte' });
        }
        
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }
        
        res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression de l\'utilisateur' });
    }
});

// Route pour les statistiques du tableau de bord
app.get('/api/stats/dashboard', isAdmin, async (req, res) => {
    try {
        const [productsCount, categoriesCount, usersCount] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM products'),
            pool.query('SELECT COUNT(*) FROM categories'),
            pool.query('SELECT COUNT(*) FROM users')
        ]);
        
        res.json({
            productsCount: parseInt(productsCount.rows[0].count),
            categoriesCount: parseInt(categoriesCount.rows[0].count),
            usersCount: parseInt(usersCount.rows[0].count)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques' });
    }
});

// Route par défaut pour le frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialiser la base de données avant de démarrer le serveur
initDatabase()
    .then(() => {
        app.listen(port, () => {
            console.log(`Le serveur est démarré sur le port ${port}`);
        });
    })
    .catch(error => {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
    });




    
const multer = require('multer');
const fs = require('fs');

const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Aucune image reçue.' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl });
});



// Suppression de plusieurs produits
app.post('/api/products/bulk-delete', isAdmin, async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Liste d\'IDs invalide' });
    }

    try {
        // Récupérer les produits avant suppression (pour avoir leurs images)
        const result = await pool.query('SELECT * FROM products WHERE id = ANY($1::int[])', [ids]);
        const productsToDelete = result.rows;

        // Supprimer les produits en base
        await pool.query('DELETE FROM products WHERE id = ANY($1::int[])', [ids]);

        // Supprimer les fichiers images correspondants
        productsToDelete.forEach(product => {
            const imageUrl = product.image_url;
            if (imageUrl && imageUrl.startsWith('/uploads/')) {
                const imagePath = path.join(__dirname, 'public', imageUrl);
                try {
                    fs.unlinkSync(imagePath);
                    console.log(`🗑 Image supprimée : ${imagePath}`);
                } catch (err) {
                    console.warn(`⚠️ Échec de suppression de ${imagePath} :`, err.message);
                }
            }
        });

        res.json({ success: true, message: 'Produits et images supprimés' });
    } catch (error) {
        console.error('Erreur lors de la suppression multiple :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

