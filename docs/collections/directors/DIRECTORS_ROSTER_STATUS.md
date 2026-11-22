# The Directors: every director, one status table

**Updated:** 2026-11-22 · **Issues:** #57 (product), #60 (editorial), #61 (art) · **Draft PR:** #63

This is the single list of every director discussed for the collection, whether in the app or not. Other documents keep their detail (research in `ROSTER_PROPOSAL.md`, ranked lists in `RANKING_BY_SCORES.md`, photo sources in `ARTWORK_REGISTER.md`); this one says where each director stands.

## Decision state

- **In the app now:** the 12 approved on 2026-11-13 (section A).
- **Owner interest, not in the app:** Christopher Nolan and Quentin Tarantino (the owner likes their films) and Francis Ford Coppola (the owner has heard of him) (section B). They were dropped from the 12 in the November research as reserves, not as a verdict on quality. Owner photo picks exist for all three.
- **Pending:** whether any of the three join the app. On 2026-11-22 the owner asked only that the project documentation include them; the app stays at 12 until the owner decides. A review page for the choice was published on 2026-11-22.

## A. In the app (12)

Ranked lists are in `src/config/directorEssentials.json`, built from the ledgers `essential10-<slug>.json` in this folder. Scores read 2026-11-13.

| # | Director | Country | Essential list | Photo (dev preview, not committed) |
|--:|---|---|---:|---|
| 1 | Akira Kurosawa | Japan | 10 | Commons, Kinema Junpō 1960 (public domain in Japan; other jurisdictions not cleared). Promising, not locked |
| 2 | Alfred Hitchcock | UK / US | 10 | Commons, CBS 1955 (US public domain claim). Not locked; low-resolution source |
| 3 | Stanley Kubrick | US / UK | 10 | Commons, Phillip A. Harrington 1949 (public domain). **Locked** |
| 4 | Ingmar Bergman | Sweden | 10 | **None chosen yet** |
| 5 | Federico Fellini | Italy | 9 | **None chosen yet** |
| 6 | Satyajit Ray | India | 10 | Commons, Dinu Alam 1981 (CC BY-SA 4.0). Not locked; low-resolution source |
| 7 | Agnès Varda | France | 9 | **None chosen yet** |
| 8 | Martin Scorsese | US | 10 | Commons, Harald Krichel 2024 (CC BY-SA 4.0). **Locked** |
| 9 | Steven Spielberg | US | 10 | Commons, Martin Kraft 2023 (CC BY-SA 4.0). **Locked** |
| 10 | Hayao Miyazaki | Japan | 10 | Owner pick A: AP/Yonhap photo via Korea JoongAng Daily. **Private use only**, no reuse licence |
| 11 | Wong Kar-wai | Hong Kong | 8 | Owner pick A: Wing Shya photo via Cine21. **Private use only**, no reuse licence |
| 12 | Bong Joon-ho | South Korea | 7 | Commons, Jay Dixit 2025 (CC BY-SA 4.0). Not locked |

Lists shorter than ten are deliberate (the output does not support padding): Fellini 9, Varda 9, Wong 8, Bong 7.

## B. Owner interest, not in the app (3)

None of these has a researched Essential 10, score ledger or app data yet.

| Director | TMDB person | Why the November research held them back | Owner interest | Photo pick |
|---|---|---|---|---|
| Christopher Nolan | 525 | First reserve. Popular and inventive, but a shorter body of work and a narrower influence case than the twelve. | Likes his films | **Locked.** Commons, Philip Romano (CC BY-SA 4.0) |
| Quentin Tarantino | 138 | Influential, but a short filmography (about nine to ten features), so a ten-film list would be nearly his whole career. | Likes his films | Chosen A: OSN+ studio portrait. Photographer and licence **unverified**, not downloaded |
| Francis Ford Coppola | to verify | Alternate to Scorsese and Spielberg; a peak few can match in the 1970s. | Has heard of him | Chosen B: Bernard Gotfryd 1973. Library of Congress states no known copyright restrictions; Commons lists it as public domain |

**If any join the app, the work is:**
1. Research a ranked list the same way as the twelve: IMDb and Rotten Tomatoes ranks averaged, 10-review RT floor, every figure sourced with a link and read date, shorter lists allowed. New ledger `essential10-<slug>.json` here, then the matching entry in `src/config/directorEssentials.json`.
2. Add the person to the allowlist behind `GET /api/directors/:id` (see the blueprint's API section) and verify the TMDB person id and directing credits.
3. Change the screen copy that says twelve ("Twelve filmmakers…", "12 profiles") and the carousel's "n of 12" labels follow the list length automatically.
4. Add the photo under `public/assets/collections/legendary-directors/directors/<slug>/portrait.webp` once approved (never committed unapproved), and the credit line.

## C. Other reserves

Considered and not picked, in rough order: Yasujirō Ozu, Andrei Tarkovsky, Orson Welles, Billy Wilder, Krzysztof Kieślowski, David Lynch, Pedro Almodóvar, François Truffaut, Jean-Luc Godard, Park Chan-wook, Jane Campion. Earlier provisional names also dropped: Spike Lee, Sofia Coppola, Wes Anderson.

## Photo rules that apply to every director

- Photos are made or chosen by the owner. A photo choice is not a licence: only the Commons picks have a stated licence, and CC BY-SA ones need credit, a note that the image was cropped, and ShareAlike if the app is ever distributed.
- Miyazaki, Wong Kar-wai and Tarantino picks come from news or magazine pages. They are fine for the owner's private household app and must be replaced before any public release.
- Spielberg and Bong carry a Commons personality-rights notice; Hitchcock and Ray come from small source images (soft on large screens).
- Provenance drafts, originals and checksums live outside the repo in `hearth_v2/art-source/legendary-directors/`. Nothing is committed to the repository without the owner's approval.
