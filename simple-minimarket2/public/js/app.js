// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser toutes les fonctionnalités
    initNavigation();
    initCartFunctionality();
    initAdminModal();
    initSearch();
    loadCategories();
    loadProducts();
    initContactForm();
});

// Variables globales 
let allProducts = [];
let selectedCategory = 'all';
let searchQuery = '';

// Fonctions pour la navigation et le menu mobile
function initNavigation() {
    const hamburger = document.getElementById('hamburger-menu');
    const menu = document.querySelector('.menu');
    
    if (hamburger && menu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            menu.classList.toggle('active');
        });
    }

    // Gestionnaire d'événements pour les liens d'ancrage
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            e.preventDefault();
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialiser les fonctionnalités du panier
function initCartFunctionality() {
    const cartToggler = document.getElementById('cart-toggler');
    const cartDrawer = document.getElementById('cart-drawer');
    const closeCart = document.getElementById('close-cart');
    const backdrop = document.getElementById('backdrop');
    const checkoutBtn = document.getElementById('checkout-btn');
    const clearCartBtn = document.getElementById('clear-cart');
    
    // Afficher le panier
    if (cartToggler && cartDrawer && backdrop) {
        cartToggler.addEventListener('click', () => {
            cartDrawer.classList.add('open');
            backdrop.classList.add('visible');
            
            // Mettre à jour l'interface du panier
            cart.updateCartUI();
        });
    }
    
    // Fermer le panier
    if (closeCart && cartDrawer && backdrop) {
        closeCart.addEventListener('click', () => {
            cartDrawer.classList.remove('open');
            backdrop.classList.remove('visible');
        });
    }
    
    // Commander via WhatsApp
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.items.length === 0) {
                cart.showToast('Votre panier est vide', 'error');
                return;
            }
            
            const whatsappLink = cart.generateWhatsAppLink();
            window.open(whatsappLink, '_blank');
        });
    }
    
    // Vider le panier
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (cart.items.length === 0) {
                cart.showToast('Votre panier est déjà vide', 'info');
                return;
            }
            
            if (confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
                cart.clearCart();
            }
        });
    }
    
    // Cliquer en dehors du panier pour le fermer
    if (backdrop && cartDrawer) {
        backdrop.addEventListener('click', () => {
            cartDrawer.classList.remove('open');
            document.getElementById('admin-modal').classList.remove('open');
            backdrop.classList.remove('visible');
        });
    }
    
    // Mettre à jour l'interface du panier au chargement
    cart.updateCartUI();
}

// Initialiser la modal pour la connexion admin
function initAdminModal() {
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const footerAdminBtn = document.getElementById('footer-admin-btn');
    const adminModal = document.getElementById('admin-modal');
    const closeModal = document.getElementById('close-modal');
    const backdrop = document.getElementById('backdrop');
    const loginForm = document.getElementById('admin-login-form');
    
    // Ouvrir la modal admin
    function openAdminModal() {
        adminModal.classList.add('open');
        backdrop.classList.add('visible');
    }
    
    if (adminLoginBtn && adminModal && backdrop) {
        adminLoginBtn.addEventListener('click', openAdminModal);
    }
    
    if (footerAdminBtn) {
        footerAdminBtn.addEventListener('click', openAdminModal);
    }
    
    // Fermer la modal admin
    if (closeModal && adminModal && backdrop) {
        closeModal.addEventListener('click', () => {
            adminModal.classList.remove('open');
            backdrop.classList.remove('visible');
        });
    }
    
    // Gérer la soumission du formulaire de connexion
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const loginError = document.getElementById('login-error');
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Rediriger vers le tableau de bord admin
                    window.location.href = '/admin/dashboard.html';
                } else {
                    loginError.textContent = data.message || 'Identifiants invalides';
                }
            } catch (error) {
                console.error('Erreur de connexion:', error);
                loginError.textContent = 'Erreur de connexion au serveur';
            }
        });
    }
    
    // Écouter les événements personnalisés pour ouvrir la modal admin
    window.addEventListener('open-admin-modal', openAdminModal);
}

// Initialiser la recherche de produits
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput && searchBtn) {
        // Recherche au clic sur le bouton
        searchBtn.addEventListener('click', () => {
            searchQuery = searchInput.value.trim();
            filterProducts();
        });
        
        // Recherche à la pression de la touche Entrée
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchQuery = searchInput.value.trim();
                filterProducts();
            }
        });
    }
}

// Charger les catégories depuis l'API
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des catégories');
        }
        
        const categories = await response.json();
        displayCategories(categories);
    } catch (error) {
        console.error('Erreur:', error);
        // Utiliser des catégories par défaut en cas d'erreur
        displayCategories([
            { id: 1, name: 'Épicerie', slug: 'epicerie' },
            { id: 2, name: 'Boissons', slug: 'boissons' },
            { id: 3, name: 'Produits Frais', slug: 'produits-frais' },
            { id: 4, name: 'Hygiène', slug: 'hygiene' }
        ]);
    }
}

// Afficher les catégories dans l'interface
function displayCategories(categories) {
    const categoryWrapper = document.getElementById('category-wrapper');
    
    if (categoryWrapper) {
        // L'élément "Tous" est déjà présent dans le HTML
        
        // Ajouter les autres catégories
        categories.forEach(category => {
            const categoryBtn = document.createElement('button');
            categoryBtn.classList.add('category-btn');
            categoryBtn.dataset.category = category.id.toString();
            categoryBtn.textContent = category.name;
            
            categoryBtn.addEventListener('click', () => {
                // Retirer la classe active de tous les boutons
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Ajouter la classe active à ce bouton
                categoryBtn.classList.add('active');
                
                // Mettre à jour la catégorie sélectionnée et filtrer les produits
                selectedCategory = categoryBtn.dataset.category;;
                filterProducts();
            });
            
            categoryWrapper.appendChild(categoryBtn);
        });
    }
}

// Ajouter l'événement manuellement au bouton "Tous"
const allButton = document.querySelector('.category-btn[data-category="all"]');
if (allButton) {
    allButton.addEventListener('click', () => {
        // Retirer la classe active de tous les boutons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        allButton.classList.add('active');
        selectedCategory = 'all';
        filterProducts();
    });
}


// Charger les produits depuis l'API
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des produits');
        }
        
        allProducts = await response.json();
        displayProducts(allProducts);
    } catch (error) {
        console.error('Erreur:', error);
        // Utiliser des produits par défaut en cas d'erreur
        allProducts = [
            {
                id: 1,
                name: 'Riz Premium',
                description: 'Riz de qualité supérieure, parfait pour accompagner tous vos plats.',
                price: 2500,
                imageUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8Z3JvY2VyeXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
                categoryId: 1
            },
            {
                id: 2,
                name: 'Eau minérale (pack de 6)',
                description: 'Pack de 6 bouteilles d\'eau minérale naturelle, 1.5L chacune.',
                price: 1200,
                imageUrl: 'https://images.unsplash.com/photo-1553530979-fbb9e4aee36f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8YmV2ZXJhZ2VzfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
                categoryId: 2
            },
            {
                id: 3,
                name: 'Légumes frais (assortiment)',
                description: 'Assortiment de légumes frais de saison, cultivés localement.',
                price: 1500,
                imageUrl: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8ZnJlc2glMjBwcm9kdWNlfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
                categoryId: 3
            },
            {
                id: 4,
                name: 'Kit d\'hygiène personnel',
                description: 'Kit complet d\'hygiène personnelle comprenant savon, shampoing et dentifrice.',
                price: 3500,
                imageUrl: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTJ8fHRvaWxldHJpZXN8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
                categoryId: 4
            },
            {
                id: 5,
                name: 'Pâtes alimentaires',
                description: 'Pâtes de blé dur de haute qualité, parfaites pour vos plats italiens.',
                price: 800,
                imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fHBhc3RhfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
                categoryId: 1
            },
            {
                id: 6,
                name: 'Jus de fruits naturel',
                description: 'Jus de fruits 100% naturel sans sucre ajouté ni conservateurs.',
                price: 1800,
                imageUrl: 'https://cdn.pixabay.com/photo/2016/07/21/11/17/drink-1532300_1280.jpg',
                categoryId: 2
            },
            {
                id: 7,
                name: 'Savon naturel',
                description: 'Savon artisanal fabriqué à partir d\'ingrédients naturels et huiles essentielles.',
                price: 750,
                imageUrl: 'https://cdn.pixabay.com/photo/2017/11/08/19/39/soap-2931653_1280.jpg',
                categoryId: 4
            },
            {
                id: 8,
                name: 'Conserve de tomates',
                description: 'Tomates pelées en conserve, idéales pour vos sauces et plats mijotés.',
                price: 600,
                imageUrl: 'https://images.unsplash.com/photo-1608835291093-394b0c943a75?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8Y2FubmVkJTIwZm9vZHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
                categoryId: 1
            }
        ];
        displayProducts(allProducts);
    }
}

// Afficher les produits dans l'interface
function displayProducts(products) {
    const featuredProducts = document.getElementById('featured-products');
    const allProductsGrid = document.getElementById('all-products-grid');
    
    // Fonction pour créer un élément de produit
    function createProductElement(product) {
        return `
            <div class="product-card" data-id="${product.id}" data-category="${product.categoryId}">
                <div class="product-image">
                    <img src="${product.imageUrl}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <p class="product-price">${Math.floor(product.price).toLocaleString()} FCFA</p>
                    <div class="product-actions">
                        <button class="add-to-cart" data-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i> Ajouter au panier
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Afficher tous les produits
    if (allProductsGrid) {
        allProductsGrid.innerHTML = products.length > 0 
            ? products.map(createProductElement).join('') 
            : '<p class="no-products">Aucun produit trouvé</p>';
    }
    
    // Ajouter des écouteurs d'événements pour les boutons "Ajouter au panier"
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.currentTarget.dataset.id);
            const product = products.find(p => p.id === productId);
            
            if (product) {
                cart.addItem(product);
            }
        });
    });
}

// Filtrer les produits en fonction de la catégorie et de la recherche
function filterProducts() {
    const filteredProducts = allProducts.filter(product => {
        const matchesCategory = selectedCategory === 'all' || 
            product.categoryId?.toString() === selectedCategory;

        const matchesSearch = searchQuery === '' ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesCategory && matchesSearch;
    });

    displayProducts(filteredProducts);

    if (searchQuery !== '') {
        const productsSection = document.getElementById('all-products');
        if (productsSection) {
            window.scrollTo({
                top: productsSection.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    }
}

// Fonction utilitaire pour obtenir l'ID de catégorie à partir du slug
function getCategoryIdFromSlug(slug) {
    // Mappage des slugs aux IDs de catégorie (à adapter selon votre structure)
    const categoryMap = {
        'epicerie': 1,
        'boissons': 2,
        'produits-frais': 3,
        'hygiene': 4
    };
    
    return categoryMap[slug] || null;
}

// Initialiser le formulaire de contact
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simuler l'envoi du formulaire
            const name = document.getElementById('name').value;
            
            // Afficher un message de confirmation
            cart.showToast(`Merci ${name}, votre message a été envoyé!`, 'success');
            
            // Réinitialiser le formulaire
            contactForm.reset();
        });
    }
}