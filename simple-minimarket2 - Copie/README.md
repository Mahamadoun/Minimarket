# Mini Market (Version Simplifiée)

Ce projet est une application d'e-commerce simplifiée pour "Mini Market HMA Distribution". Il permet aux clients de parcourir les produits, de les ajouter à un panier, et de passer commande via WhatsApp.

## Technologies utilisées

- Frontend: HTML, CSS, JavaScript vanilla
- Backend: Node.js avec Express
- Base de données: PostgreSQL
- Style: CSS personnalisé avec design responsive
- Icônes: Font Awesome
- Fontes: Google Fonts (Poppins)

## Fonctionnalités principales

- Affichage des produits par catégorie
- Recherche de produits
- Panier d'achat
- Commande via WhatsApp
- Panneau d'administration protégé par authentification
  - Gestion des produits
  - Gestion des catégories
  - Gestion des utilisateurs (super admin uniquement)

## Installation

1. Cloner le repository
2. Installer les dépendances avec `npm install`
3. Configurer les variables d'environnement (voir `.env.example`)
4. Démarrer l'application avec `npm start`

## Accès à l'administration

- URL: `/admin/dashboard.html` (accessible via le bouton Admin)
- Identifiants par défaut:
  - Utilisateur: admin
  - Mot de passe: admin123

## Structure du projet

- `/public` - Contient tous les fichiers frontend (HTML, CSS, JS, images)
  - `/css` - Feuilles de style
  - `/js` - Scripts JavaScript
  - `/img` - Images et SVG
  - `/admin` - Pages d'administration