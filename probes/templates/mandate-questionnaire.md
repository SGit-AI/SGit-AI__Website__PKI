# The mandate questionnaire

*The template an agent is pointed at in step 4 of the workflow. The questions are about WORK, never about capability: a questionnaire that asks people to enumerate permissions gets a copy of the grant back. Answered locally, in your fork, under `yours/`, and never uploaded.*

Ask these in order, one at a time, and write the answers down in the person's own words before you translate any of them into capability primitives.

1. **What is this agent for?** One sentence. If the answer is "everything", ask what it did last week.
2. **What would surprise you if it did it?** Not what would be wrong — what would make you say "I didn't know it could do that".
3. **What must never happen?** The things you would not accept at any price. These become the exclusions.
4. **Who would you tell if it did?** The name is the acceptor. If there is no name, there is no acceptance, and the row stays open.
5. **Which of these is it allowed to touch on its own, and which only when you are watching?** Files outside the project · the internet · your credentials · your mail · your code hosts · your money · things that outlive the turn.

Then, and only then, translate: the answer to 1 and 5 is the mandate (an allow-list of capability primitives); the answer to 3 is the exclusion list; the answer to 4 is the acceptor of everything in the grant that the mandate does not cover.

**Two rules.** The mandate is written in the primitives' words so that the delta can be computed, and it is never written into the repository — `yours/` is gitignored, and this file says so twice. And the delta is computed in your clone: nothing about your estate leaves it.
