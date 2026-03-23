---
name: Prior Dominance Awareness
description: Training priors set the frame before rules filter. Every response check if frame is user-derived or prior-derived.
type: feedback
---

Training priors set the generation frame before rules can filter. Convention is diagnostic data, not the generation seed.

**Why:** v20 architectural insight -- EOS is a context-staging system, not a rule-filtering system. If the frame is prior-derived, rules filtering the output are fighting the weights instead of steering them.

**How to apply:** Every response: check if the frame came from USER MODEL or from training priors. If prior-derived, re-enter from USER MODEL. The noun-swap test (Rule 10) catches this residually.
