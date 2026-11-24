# Astrivo format v3 — the "silent character drama" format

This replaces the old 30–45 second narrated format. It is copied from the **technique** of the
best-performing Shorts in this exact niche, measured frame by frame (see "Where these rules come
from" at the bottom). PIPELINE.md sections 2, 4b–4e and 5 now follow these rules.

Why we changed: our Shorts hold 65–70% average view duration and only 56–60% of viewers stay past
the opening. The reference Shorts win on both numbers because they are **half as long**, have
**no voiceover**, and open **in the middle of an action** instead of in the middle of a sentence.

---

## 0. The five rules that matter most

1. **15–22 seconds.** Target 18. Never over 25.
2. **No voiceover.** Music + sound effects only. The pictures carry everything.
3. **Frame 0 is mid-action.** Something is already being hit, cut, stabbed or launched at t=0.
4. **Planets are characters with faces** that react — scared, smug, angry, happy.
5. **A story with a conflict**, not a list of facts: someone does something to someone else.

---

## 1. Length and the beat grid

| | value |
|---|---|
| Total length | **15–22 s** (target 18 s) |
| Beats | **6–9**, each **1.8–3.0 s** |
| Hook beat | 0.0–1.0 s |
| Climax beat | at **75–85%** of total (≈ 14–15 s in an 18 s Short) |
| Payoff / resolution | the last **2–3 s**, calmer |
| Hard cuts in the whole Short | **0–4.** Prefer 1. |

There is no spoken script, so beats are keyed to a **beat grid** from the music BPM, not to words.
At 100 BPM one beat = 0.6 s; a story beat is 3–5 music beats. Put every pop, hit and label change
on a music beat — that is what makes it feel tight.

## 2. The script is now a beat sheet

Write `jobs/<id>/beats.md` instead of spoken segments. Each beat is one line:

```
B1  0.0–1.0   Jupiter's sword is ALREADY mid-swing; it slices past Earth. Earth squashes, flies right.
B2  1.0–3.0   Jupiter winds up, slashes again. Earth cracks open. Hard push-in on the crack.
B3  3.0–6.0   Earth is split: core visible. Labels type in: IRON, NICKEL (green, leader lines).
...
B7 14.0–16.0  CLIMAX: the Sun blasts a wall of fire. Earth's shield flares. White flash, shake.
B8 16.0–18.0  PAYOFF: Earth whole and smug, aurora glowing. Label: AURORA. Loops to B1 framing.
```

Rules for the beat sheet:
- **Every beat is a physical action**, something a character does or something done to them.
  "Earth explains its core" is not a beat. "Jupiter rips Earth's core out" is.
- **Beat 1 is the middle of an action, not the start of one.** No approach, no establishing shot,
  no empty sky, no title card. The sword is already swinging at frame 0.
- **Escalate.** Each beat must raise the stakes or add a bigger number than the last.
- **One climax** at 75–85%, the biggest visual and the loudest sound of the Short.
- **End on the answer to the title**, held calm for ~2 s, framed so it loops into beat 1.
- Facts must be true. Check any number you are not sure of with a web search.

### Story shapes that work in this niche
Pick one. These are the shapes behind the biggest Shorts in the niche:
- **Contest / VS** — "who is biggest / strongest / fastest". Line them up, escalate, reveal a winner.
- **Attack and defence** — something threatens Earth, Earth survives because of X.
- **Sacrifice** — one body gives something up for another. Strong emotional pull.
- **Theft / extraction** — take a thing away from each body in turn and tally it up.
- **Transformation** — change one property and watch the consequences cascade.

"What if" and "why" still work, but phrase the title as a **contest or a claim**, not a lecture.
`Earth's Water Is Nothing` beats `How Much Water Is On Earth?`.

## 3. On-screen text — exact geometry

All positions in the logical 1080×1920 frame.

### 3a. The title banner (always on, whole video)
- **Position:** centred, top edge at **y ≈ 120**, bottom at **y ≈ 300**.
- **Height:** one line ≈ **67 px**; two lines ≈ **180 px**. Two lines is normal.
- **Width:** **72–75%** of the frame, so side margins ≈ **130–150 px**.
- **Style:** heavy bold *italic*, ALL CAPS, thick black outline, slight drop shadow.
- **Colour: each word a different colour**, cycling through:
  `#F0AA17` amber → `#FFFFFF` white → `#0EA9F3` cyan → `#CE05D8` magenta.
  Keep the most important word amber or magenta.
- It **never leaves the screen** and it never animates after the first frame. It is the thing that
  keeps a scrolling viewer oriented when they land mid-video.

### 3b. Numbers (the counter)
- **Colour `#30F80A`** (hard bright green), heavy bold italic, black outline.
- **Position y 1170–1360** (61–71% down the frame), usually under the object it describes.
- **Size:** at least **90 px**; the final/biggest number **≥ 140 px**.
- Numbers **pop in** (overshoot) on a music beat with a short click sound.
- **A running tally beats separate numbers.** Make one number grow through the Short
  (1.4B → 3B → 7B → 9B). The viewer stays to see where it ends. This is the single strongest
  retention device in the reference Shorts.
- A number that gets **struck through and replaced** by a bigger one is worth using once.

### 3c. Names and labels
- **White**, bold italic, black outline, with a **thin white leader line** to the thing named.
- They **type in letter by letter** over ~0.3 s, or fade up from transparent over ~0.4 s.
- Short words only: `EUROPA`, `IRON`, `AURORA`, `MAGNETIC FIELD`. Never a sentence.
- **Maximum 6 labels in the whole Short.** They are seasoning, not narration.

### 3d. Safe zones
- Nothing important **below y 1500** (bottom 22%) — YouTube's UI covers it.
- Nothing important in the **right 150 px**.
- Small channel watermark at **y ≈ 1690**, centred, low opacity.
- **There are no captions.** Delete the caption layer for v3 jobs.

## 4. The look

- **Background `#00011B`** — near-black navy, much darker than our old gradient. Keep it flat and
  dark so the characters and the green numbers pop. Small parallax stars, slow drift.
- **Characters:** every body is a character with a **face** — two big white eyes with black
  outlines, eyebrows that angle for anger, a mouth that opens wide for shock. Reuse the `eye` and
  `buddy` helpers in `flat/style.js`; add a `face(x, cx, cy, r, {mood, look})` helper so any
  `planet()` or `earth()` can wear one. Moods: `calm, scared, angry, smug, happy, strain, pain`.
- **Squash and stretch on every impact.** When Earth is hit it becomes an oval, then springs back
  over ~0.25 s. This is what makes hits feel physical. `earth()` already takes `bulge`/`quake`.
- **Props are allowed and encouraged** — a sword, a giant syringe, a hammer. A silly physical prop
  is what turns a fact into a story. Keep them flat-vector in our palette.
- **Astrivo's characters must be our own.** Do not reproduce another channel's character designs,
  mascots or specific scenes — that is their artwork, and a copy reads as a knockoff anyway.
  Copy the *technique* in this document: timing, structure, geometry, sound, camera. Give Astrivo
  its own face design (we use a rounder eye and our own colour palette) and its own gags.

## 5. Camera and cutting

This is the biggest animation change. **We were cutting far too much.** Measured in the references:
19 s of video with **2 frame-level cuts**; 18 s with **4**. Our old rule said a cut every 2–3 s.

- **Default to no cut.** Move the camera instead: pan across to the next character, push in, pull out.
  The whole Short should feel like one continuous shot wherever the story allows.
- **Motion profile:** highest motion in the **first 2 seconds** (a hard push-in or a fast slash),
  a **calmer middle** where labels and numbers can be read, then **rising motion into the climax**,
  then **calm for the last 2 s**.
- **Allowed cuts:** one hard cut into the climax (with a white flash), and at most one cross-section
  reveal cut. That is it.
- **Never a still frame.** Even in the calm middle, something drifts, spins, breathes or sparkles.
- **End wide.** The final beat is usually a pull-back that shows the whole comparison at once, held
  for ~1.5–2 s. Viewers loop to read it, which is free watch time.

## 6. Sound (no voice)

- **No voiceover.** Do not call ElevenLabs for v3 jobs. `voice_url` is omitted; `render.mjs` already
  handles a missing `--voice` by substituting silence, and the mix still lands at −14 LUFS.
- **Music:** one continuous high-energy bed, driving drums, no long intro — it must be at full
  level by 0.2 s. Target **−14 LUFS integrated, −1.5 dBTP**, which the renderer already does.
  For the real uploads, pick the track in **YouTube's own Shorts audio picker** so it is licensed
  and can pick up trending-audio reach. Do not rip a copyrighted song into the MP4.
- **A sound on every physical beat:** slash, whoosh, suction, impact, electric crackle, pop.
- **Cartoon vocal grunts** on character hits ("ugh!", a gasp, a yelp) are a big part of why the
  references feel alive. Short, non-verbal, no words.
- **A click or pop on every number and label** as it lands.
- Because there is no voice to duck under, **the music can sit much louder than before**.

## 7. The title (YouTube)

- 3–7 words, a **claim or a contest**, not a question with an obvious answer.
- Emoji at the end is normal in this niche and does not hurt (🥹 😳 🤯).
- The YouTube title and the on-screen banner should match closely so a viewer who clicks from
  search instantly sees the same words.

---

## Where these rules come from

Two reference Shorts from this exact niche were measured frame by frame and read by a video model:

| | Short A | Short B |
|---|---|---|
| Topic | magnetic field | Earth's water |
| Length | **19.0 s** | **17.9 s** |
| Views | ~54.9 M in ~4 months | ~12.1 M in ~2 months |
| Voiceover | **none** (music + SFX) | **none** (music + SFX) |
| Hard cuts | **2** | **4** |
| Loudness | −14.0 LUFS, −1.7 dBTP | −13.7 LUFS, −1.8 dBTP |
| Title banner | persistent, top 6–15% | persistent, top 6–15% |
| Captions | none | none |
| Counter | 946 → 1,670 km/h | 1.4B → 3B → 7B → 9B km³ |

The same channel's 50 most-viewed Shorts are **all 10–28 seconds**, average ≈ 22 s. Not one is
30–45 s, which is what our old rules specified.

Caveat worth keeping in mind: this is one channel's formula, measured carefully, not a controlled
experiment. The length, the missing voiceover and the mid-action opening are the changes most
likely to move our retention numbers, because they directly target the two things we are losing on
(early swipe-away and average view duration). Treat the character/prop style as the part to
experiment with, and re-check our own retention after 5–10 Shorts in this format.
