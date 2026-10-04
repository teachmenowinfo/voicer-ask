# voicer-ask

`ask.css` / `ask.js`: generated from Voicer (don't edit). `views.js`: hand-written
ready-made screens (start menu, ranking, pick list, report, simulation, buttons)
that a widget fills with data, e.g. `V.ranking({...})`.


The question boxes (buttons, dropdown, tick boxes, text, number, date) that
Voicer's chatflow draws, packaged so Claude desktop chat widgets can load them
from jsDelivr instead of carrying ~16 KB inline. Generated — don't edit by hand.

Built from voicer-core `app/web/js/198-ask.js`, `005-delegate.js` and the `.ask`
rules of `app/web/dashboard.css` by `~/.claude/skills/_shared/voicer_ask.py --publish`.
Each release is a tag (`v1`, `v2`, …); widgets pin the tag.
