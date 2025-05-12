// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification
    checkAuth();
    
    // Initialiser les événements
    initEvents();
    
    // Charger les données du tableau de bord
    loadDashboardData();
    
    // Charger les produits récents
    loadRecentProducts();
    
    // Cacher le lien des utilisateurs si l'utilisateur n'est pas super admin
    checkSuperAdminAccess();
});

// Vérifier si l'utilisateur est authentifié
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
            // Rediriger vers la page de connexion (index.html)
            window.location.href = '../index.html';
            return;
        }
        
        const user = await response.json();
        
        // Vérifier si l'utilisateur est admin
        if (!user.isAdmin) {
            // Rediriger vers la page d'accueil
            window.location.href = '../index.html';
            showToast('Accès non autorisé', 'error');
        }
    } catch (error) {
        console.error('Erreur de vérification d\'authentification:', error);
        window.location.href = '../index.html';
    }
}

// Vérifier si l'utilisateur est super admin
async function checkSuperAdminAccess() {
    try {
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
            const user = await response.json();
            
            // Cacher le lien des utilisateurs si l'utilisateur n'est pas super admin
            const usersLink = document.getElementById('users-link');
            if (usersLink && !user.isSuperAdmin) {
                usersLink.parentElement.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Erreur de vérification des droits super admin:', error);
    }
}

// initialiser les evenement (supprimer et remplacer)

// Charger les données du tableau de bord
async function loadDashboardData() {
    try {
        const response = await fetch('/api/stats/dashboard');
        
        if (response.ok) {
            const stats = await response.json();
            
            document.getElementById('products-count').textContent = stats.productsCount;
            document.getElementById('categories-count').textContent = stats.categoriesCount;
            document.getElementById('users-count').textContent = stats.usersCount;
        } else {
            console.error('Erreur lors du chargement des statistiques');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

// Charger les produits récents
async function loadRecentProducts() {
    const recentProductsElement = document.getElementById('recent-products');
    
    if (!recentProductsElement) return;
    
    try {
        const response = await fetch('/api/products?limit=5');
        
        if (response.ok) {
            const products = await response.json();
            
            if (products.length === 0) {
                recentProductsElement.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">Aucun produit trouvé</td>
                    </tr>
                `;
                return;
            }
            
            // Obtenir les catégories pour associer les noms de catégories
            const categoriesResponse = await fetch('/api/categories');
            const categories = await categoriesResponse.json();
            
            // Créer une map des catégories pour une recherche rapide
            const categoryMap = {};
            categories.forEach(category => {
                categoryMap[category.id] = category.name;
            });
            
            recentProductsElement.innerHTML = products.map(product => `
                <tr>
                    <td>
                        <div class="table-image">
                            <img src="${product.imageUrl}" alt="${product.name}">
                        </div>
                    </td>
                    <td>${product.name}</td>
                    <td>${categoryMap[product.categoryId] || 'Non catégorisé'}</td>
                    <td>${Math.floor(product.price).toLocaleString()} FCFA</td>
                    <td>
                        <div class="action-buttons">
                            <a href="products.html?id=${product.id}" class="edit-btn">
                                <i class="fas fa-edit"></i>
                            </a>
                            <button class="delete-btn" data-id="${product.id}" onclick="deleteProduct(${product.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
            
        } else {
            recentProductsElement.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">Erreur lors du chargement des produits</td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des produits récents:', error);
        recentProductsElement.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Erreur lors du chargement des produits</td>
            </tr>
        `;
    }
}

// Supprimer un produit
async function deleteProduct(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast('Produit supprimé avec succès', 'success');
                
                // Recharger la page après 1 seconde
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                const data = await response.json();
                showToast(data.message || 'Erreur lors de la suppression du produit', 'error');
            }
        } catch (error) {
            console.error('Erreur de suppression du produit:', error);
            showToast('Erreur lors de la suppression du produit', 'error');
        }
    }
}

// Supprimer une catégorie
async function deleteCategory(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast('Catégorie supprimée avec succès', 'success');
                
                // Recharger la page après 1 seconde
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                const data = await response.json();
                showToast(data.message || 'Erreur lors de la suppression de la catégorie', 'error');
            }
        } catch (error) {
            console.error('Erreur de suppression de la catégorie:', error);
            showToast('Erreur lors de la suppression de la catégorie', 'error');
        }
    }
}

// Supprimer un utilisateur
async function deleteUser(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast('Utilisateur supprimé avec succès', 'success');
                
                // Recharger la page après 1 seconde
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                const data = await response.json();
                showToast(data.message || 'Erreur lors de la suppression de l\'utilisateur', 'error');
            }
        } catch (error) {
            console.error('Erreur de suppression de l\'utilisateur:', error);
            showToast('Erreur lors de la suppression de l\'utilisateur', 'error');
        }
    }
}

// Afficher une notification toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.querySelector('.toast-message');
    const toastIcon = document.querySelector('.toast-icon');
    
    if (toast && toastMessage) {
        // Définir le message et le type
        toastMessage.textContent = message;
        
        // Ajuster l'icône en fonction du type
        if (toastIcon) {
            toastIcon.className = 'fas toast-icon';
            if (type === 'success') {
                toastIcon.classList.add('fa-check-circle', 'success');
            } else if (type === 'error') {
                toastIcon.classList.add('fa-times-circle', 'error');
            } else {
                toastIcon.classList.add('fa-info-circle');
            }
        }
        
        // Afficher le toast
        toast.classList.add('show');
        
        // Masquer le toast après 3 secondes
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}


// Evenement bouton de deconnexion des admins
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        if (response.ok) {
            window.location.href = '../index.html';
        } else {
            showToast('Erreur lors de la déconnexion', 'error');
        }
    });
}

// Récuperation d'image en local(supprimer et remplacer)


