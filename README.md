# ByKevin — Fusion Expert (PWA / APK)

Fusion de 4 projets : MRT (pré-visite CT), AutoDiag + formation, Juridique auto, Aide technique, OBD/ELM, accès tiers par notification.

## Fichiers
- index.html : application complète (client-side, IndexedDB + fallback localStorage, chiffrement AES-GCM, IA locale, ELM/UDS)
- manifest.webmanifest : manifest PWA statique (requis PWABuilder)
- sw.js : service worker (cache offline)
- migration.html : import/fusion/rollback des bases des 4 anciens projets
- generate-icons.html : génère les 6 icônes PNG dans le navigateur (sans Node)
- extracteur-console.js : à coller dans la console des anciens projets pour exporter leur base
- .nojekyll : désactive Jekyll sur GitHub Pages

## Déploiement GitHub Pages
1. Pousser tous les fichiers à la racine du repo `bykevin`.
2. Générer les icônes : ouvrir generate-icons.html, télécharger, mettre dans un dossier `icons/`, uploader sur GitHub.
3. Settings → Pages → Source: Deploy from a branch → main → /(root).
4. Tester :
   - https://TON-USER.github.io/bykevin/
   - https://TON-USER.github.io/bykevin/manifest.webmanifest
   - https://TON-USER.github.io/bykevin/sw.js
   - https://TON-USER.github.io/bykevin/icons/icon-192.png

## Connexion propriétaire
- Code par défaut : BYKEVIN-OWNER (modifiable dans Admin).
- Onglet Accès toujours accessible même verrouillé.

## APK
- PWABuilder : coller l'URL GitHub Pages → Package Android.
- Capacitor : npx cap init "ByKevin" com.bykevin.app --web-dir=. ; npx cap add android ; npx cap sync ; cd android && ./gradlew assembleRelease
- Plugin Bluetooth natif : @capacitor-community/bluetooth-serial (transport "capbt").

## Backend optionnel
- Renseigner une URL dans Admin → URL backend pour push multi-postes / WebSocket / sync.
- Sans backend : mode solo, tout fonctionne en local.

## Migration des 4 projets
- Ouvrir chaque ancien projet (version web) → F12 Console → coller extracteur-console.js → récupérer le JSON.
- ByKevin → Admin → Migration → Ouvrir migration.html → importer les JSON (fusion + rollback).

## Limites honnêtes
- GitHub Pages n'exécute pas de serveur : push réel multi-appareils nécessite le backend optionnel.
- On ne peut pas lire la base privée d'une APK depuis une autre APK sans export (extracteur ou bouton export natif).
- ELM327 générique ≠ valise OEM : routines/calibrages exacts = profils constructeur documentés (placeholders 000000 à remplacer).
