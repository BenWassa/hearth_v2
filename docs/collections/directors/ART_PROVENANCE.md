# The Directors: signature and logo provenance

**Updated:** 2026-11-22 · **Issues:** #61 (art), #65 (missing signatures) · **Status:** dev preview only. The image files are not in git; this file records where each came from. Read dates are 2026-11-22; licences were read from Wikimedia Commons file metadata, not from memory.

## Signatures (all from Wikimedia Commons)

| Director | Source file | Licence | Credit needed in app |
|---|---|---|---|
| Akira Kurosawa | [Akira_Kurosawa_Signature.svg](https://commons.wikimedia.org/wiki/File:Akira_Kurosawa_Signature.svg) | Public domain (signature) | No |
| Alfred Hitchcock | [Alfred_Hitchcock_Signature.svg](https://commons.wikimedia.org/wiki/File:Alfred_Hitchcock_Signature.svg) | Public domain (signature) | No |
| Stanley Kubrick | [Stanley_Kubrick_Signature.svg](https://commons.wikimedia.org/wiki/File:Stanley_Kubrick_Signature.svg) | Public domain (signature) | No |
| Satyajit Ray | [Satyajit_Ray_Signature.svg](https://commons.wikimedia.org/wiki/File:Satyajit_Ray_Signature.svg) | Public domain (signature) | No |
| Steven Spielberg | [Steven_Spielberg_Signature.svg](https://commons.wikimedia.org/wiki/File:Steven_Spielberg_Signature.svg) | Public domain (signature) | No |
| Hayao Miyazaki | [Hayao_Miyazaki_signature.svg](https://commons.wikimedia.org/wiki/File:Hayao_Miyazaki_signature.svg) | Public domain (signature) | No |
| Bong Joon-ho | [Bong_Joon-ho_signature.svg](https://commons.wikimedia.org/wiki/File:Bong_Joon-ho_signature.svg) | Public domain (signature) | No (source is only 149x150 px, so it reads faint) |
| Ingmar Bergman | [Ingmar_Bergman_Signature.png](https://commons.wikimedia.org/wiki/File:Ingmar_Bergman_Signature.png) | CC BY-SA 3.0, by Excreto | **Yes**, shown as a small line in the page footer |
| Martin Scorsese | [Scorsese-signature_2.svg](https://commons.wikimedia.org/wiki/File:Scorsese-signature_2.svg) | CC BY-SA 4.0, by Machete kills | **Yes**, same footer line |
| Wong Kar-wai | [Wong_Kar_Wai's_autograph.png](https://commons.wikimedia.org/wiki/File:Wong_Kar_Wai%27s_autograph.png) | Public domain (signature); a scan, not a vector | No |
| Federico Fellini | none found | n/a | Tracked in #65: owner to make |
| Agnès Varda | none found | n/a | Tracked in #65: owner to make |

Full records (URLs, author, licence text, read date) are kept in `art-source/legendary-directors/signatures/PROVENANCE.json` outside the repo. The credit text shown in the app lives in `SIGNATURE_CREDIT` in `src/views/DirectorsCollectionView.jsx`.

**Before any public release:** the two CC BY-SA signatures carry share-alike terms (derivatives of the image must stay under the same licence). The app only displays them recoloured, but confirm that reading before release, or replace them with owner-made signatures.

## Score logos (dev preview, trademarked)

| Logo | Source | Licence status |
|---|---|---|
| IMDb | [IMDB_Logo_2016.svg](https://commons.wikimedia.org/wiki/File:IMDB_Logo_2016.svg) | Public-domain text logo on Commons, but a registered trademark |
| Rotten Tomatoes, fresh | [Rotten_Tomatoes.svg](https://commons.wikimedia.org/wiki/File:Rotten_Tomatoes.svg) | Same |
| Rotten Tomatoes, rotten | [Rotten_Tomatoes_rotten.svg](https://commons.wikimedia.org/wiki/File:Rotten_Tomatoes_rotten.svg) | Same |

Fresh or rotten follows Rotten Tomatoes' own rule: 60% or higher is fresh, below 60% is rotten. Get brand or licensing sign-off before any public release (tracked in #60).
