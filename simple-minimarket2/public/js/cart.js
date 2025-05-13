// Classe pour gérer le panier d'achat
class ShoppingCart {
    constructor() {
        // Initialiser le panier depuis le localStorage ou vide si rien n'existe
        this.items = JSON.parse(localStorage.getItem('minimarket_cart') || '[]');
        this.updateCartCount();
    }

    // Ajouter un produit au panier
    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            // Si le produit existe déjà, augmenter sa quantité
            existingItem.quantity += 1;
        } else {
            // Sinon, ajouter le nouveau produit avec quantité 1
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: 1
            });
        }
        
        // Mettre à jour le stockage local et l'interface
        this.saveCart();
        this.updateCartCount();
        this.updateCartUI();
        
        // Afficher une notification
        this.showToast('Produit ajouté au panier avec succès!', 'success');
    }

    // Mettre à jour la quantité d'un produit
    updateQuantity(id, quantity) {
        if (quantity <= 0) {
            // Si la quantité est 0 ou moins, retirer le produit
            this.removeItem(id);
            return;
        }
        
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.quantity = quantity;
            this.saveCart();
            this.updateCartCount();
            this.updateCartUI();
        }
    }

    // Retirer un produit du panier
    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveCart();
        this.updateCartCount();
        this.updateCartUI();
    }

    // Vider le panier
    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartCount();
        this.updateCartUI();
        this.showToast('Votre panier a été vidé', 'success');
    }

    // Calculer le nombre total d'articles
    totalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    // Calculer le prix total
    totalPrice() {
        return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
    }

    // Mettre à jour le compteur du panier dans l'interface
    updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = this.totalItems();
        }
    }

    // Mettre à jour l'interface du panier
    updateCartUI() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (cartItems) {
            if (this.items.length === 0) {
                // Afficher le message de panier vide
                cartItems.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-bag"></i>
                        <p>Votre panier est vide</p>
                    </div>
                `;
            } else {
                // Afficher les produits dans le panier
                cartItems.innerHTML = this.items.map(item => `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-image">
                            <img src="${item.imageUrl}" alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <h3 class="cart-item-name">${item.name}</h3>
                            <p class="cart-item-price">${this.formatPrice(item.price)}</p>
                        </div>
                        <div class="cart-item-actions">
                            <button class="quantity-btn decrease-quantity">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="cart-item-quantity">${item.quantity}</span>
                            <button class="quantity-btn increase-quantity">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
                
                // Ajouter des écouteurs d'événements pour les boutons + et -
                this.attachQuantityHandlers();
            }
        }
        
        if (cartTotal) {
            cartTotal.textContent = this.formatPrice(this.totalPrice());
        }
    }

    // Enregistrer le panier dans le localStorage
    saveCart() {
        localStorage.setItem('minimarket_cart', JSON.stringify(this.items));
    }

    // Formater le prix pour l'affichage
    formatPrice(price) {
        return `${price.toLocaleString()} FCFA`;
    }

    // Attacher les gestionnaires d'événements pour les boutons de quantité
    attachQuantityHandlers() {
        document.querySelectorAll('.decrease-quantity').forEach(button => {
            button.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const id = parseInt(cartItem.dataset.id);
                const item = this.items.find(item => item.id === id);
                if (item) {
                    this.updateQuantity(id, item.quantity - 1);
                }
            });
        });

        document.querySelectorAll('.increase-quantity').forEach(button => {
            button.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const id = parseInt(cartItem.dataset.id);
                const item = this.items.find(item => item.id === id);
                if (item) {
                    this.updateQuantity(id, item.quantity + 1);
                }
            });
        });
    }

    // Générer un lien WhatsApp pour le checkout
    generateWhatsAppLink() {
        // Le numéro de téléphone doit commencer par le code pays
        const phoneNumber = '22371353548'; 
        
        // Construire le message avec les détails de la commande
        let message = 'Salut, je voudrais passer une commande :\n\n';
        
        // Ajouter chaque article
        this.items.forEach(item => {
            message += `${item.name} x ${item.quantity} : ${this.formatPrice(item.price * item.quantity)}\n`;
        });
        
        // Ajouter le total
        message += `\nTotal : ${this.formatPrice(this.totalPrice())}`;
        
        // Encoder le message pour l'URL
        const encodedMessage = encodeURIComponent(message);
        
        // Retourner le lien WhatsApp complet
        return `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodedMessage}`;
    }

    // Afficher une notification toast
    showToast(message, type = 'success') {
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
}

// Créer une instance de panier globale
const cart = new ShoppingCart();