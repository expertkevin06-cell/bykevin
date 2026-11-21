# ByKevin — Poste Atelier

Fusion de quatre applications en une PWA autonome, installable et packaging APK.

## Correction du pipeline de demandes tiers (v3.0.0)

**Cause racine.** L'identifiant d'une demande était marqué « vu » *avant* le contrôle du rôle
administrateur. Une demande arrivée pendant que le poste était verrouillé était donc consommée
silencieusement et ne remontait plus jamais après connexion. Trois aggravants en APK :
marquage non persistant (perte au redémarrage), isolement IndexedDB entre appareils,
et absence de canal natif fiable en TWA.

**Correctifs.**

| Mécanisme | Effet |
|---|---|
| File persistante `pipe.queue` | Une demande n'en sort qu'après **acquittement explicite** par un admin |
| `flushQueue()` au login / boot / focus | Rejeu intégral de toutes les demandes non acquittées |
| `pollNow()` auto-réparateur | Réinjecte toute demande `pending` absente de la file, à chaque cycle |
| `pipe.delivered` / `pipe.acked` | Traçabilité complète, consultable dans le détail de chaque demande |
| Registre `tiers` | Tiers **fiables**, **connus**, **nouveaux**, **bloqués** — priorité et signal distinct |
| Auto-accord | Un tiers fiable avec auto-accord est débloqué immédiatement, l'admin en est informé |
| Pont `BK1:` | Transfert d'une demande entre appareils **sans backend** (code copiable) |
| Canal natif | `Capacitor.LocalNotifications` si présent, sinon web, sinon service worker, sinon in-app |
| BroadcastChannel | Synchronisation instantanée entre onglets du même poste |
| Test de bout en bout | Sonde réelle injectée puis acquittée, dans l'auto-vérification et sur demande |

## Fichiers
