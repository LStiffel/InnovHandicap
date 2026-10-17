# InnovHandicap

A serious game about disability awareness. Through six short browser mini-games, it lets
able-bodied players feel what living with a learning or sensory disorder is like.

**Play it online: [innovhandicap.onrender.com](https://innovhandicap.onrender.com)**

The game was built by a team of eight in 48 hours during a school hackathon, then
reworked and unified after the event. The games and their in-game text are in French.

## The games

| Disorder | Game | What you experience |
| --- | --- | --- |
| Dyslexia | *Copie Miroir* | Retype a text whose letters get mixed up and flipped. Three levels: mirrored letters (b/d, p/q), phonetic substitutions, then long sentences with multiple errors. |
| ADHD | *L'attention capturée* | Click only the crabs for 30 seconds while distractions keep pulling your attention away. |
| Dyspraxia | *Dans la peau d'un dyspraxique* | Pack your schoolbag with a cursor that drifts and shakes. |
| Dyscalculia | *Vivre la dyscalculie* | Two games. Open a safe by solving equations whose digits are replaced by glyphs. Then count sheep that move, overlap and change size before they escape. |
| Colour blindness | *Désamorce la bombe* | Cut the right wires across three timed levels, with colours filtered to simulate protanopia. |

Each game ends with a short explanation of the disorder and how to support the people who
live with it.

## Design intent

The mechanics exist only to recreate the experience of each disorder. The game never asks
the player to imagine a difficulty: it makes them feel it. The tone stays playful on
purpose, because a serious game on such a hard topic only works if the player still wants
to play.

## Team

- 3 people worked on the business side: costs, customers, users and business model.
- 5 people designed and built the games, one game each.
- Léopold Stiffel led the game design of all six games and supervised the others. He built
  the dyslexia game and the second dyscalculia game. After the hackathon, he reworked every
  game, which had no shared visual style or main menu, into one consistent experience.

## Tech

Plain HTML, CSS and JavaScript, with no build step and no dependencies. Fonts come from
Google Fonts (Atkinson Hyperlegible, designed for legibility, and Caveat).

To run it locally, open `index.html` in a browser.

The site is deployed on Render as a static site (see `render.yaml`).
