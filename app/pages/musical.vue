<template>
  <main class="p-8">
    <div class="w-3/4 mx-auto mt-10">
        <ABCRenderer :abcNotation="tune" />
    </div>
  </main>
</template>

<script setup>
const tune = `
X:1
T:Nụ Cười 18 20
%%score 1 2
L:1/8
Q:1/4=115
M:4/4
K:C
%%stretchlast true
V:1 treble nm="" snm=""
%%MIDI program 0
V:2 bass nm="" snm=""
%%MIDI program 0
V:1
 z4 ed e2 | e4 de g2 | g4 ed e2 | e4 ee g2 |
 g4 eg gg | a2 g a2 g2 g | gg a c4 A | f2 ff gd cd- |
 d7/2 z/ c2 d2 | e4 g2 gg | d4 e2 ga | c'3 c' d'2 c'a |
 g4 ee ga | c'2 c' c'2 c' c'd' | e'3 c'2 z c'c' | c'2 c' a2 g2 d'- |
 d'4- d'3/2 z3/2 [gd'f']- | [gd'f']7/2 z/ ed cd | e2 ee c2 G2 | d3 c de d2 |
 c2 cc cc cd | G4 GA G2 | A4 Ac A2 | G2 z2 E E2 D |
 E2 c c2 G2 d- | d7/2 z/ ed cd | e2 ee c2 G2 | d4 ed cd |
 c2 cc cc cd | G4 AG AB | c2 c c2 c2 g- | gg a2 c3 G |
 g2 g a2 e2 d- | d2 ec c2 d2 | c4 Gc eg | (24:23:2c'8 z/ |]
V:2
 z8 | C,G, CE G4 | G,,D, G,B, D4 | A,,E, A,C E4 |
 G,,D, _B,2 C,G, _B,2 | F,,C, F,A, C4 | E,B, G2 A,,E, A,C | D,A, F2 C,G, E2 |
 z [G,B,D] [G,B,D]4- [G,B,D]3/2 z/ | C,G, CE G2 E2 | G,,D, G,B, D2 B,2 | A,,E, A,C E2 C2 |
 G,,D, _B,2 C,G, _B,E | F,,C, F,A, C2 A,2 | E,B, G2 A,,E, A,C | D,A, F2 C,G, CE |
 z [G,B,D] [G,B,D]2 [G,B,D] [G,B,D]3 | G,,,15/2 z/ | C,G, CE G2 E2 | G,,D, G,B, D2 B,2 |
 A,,E, A,C E2 C2 | G,,D, B,2 C,G, _B,E | F,,C, F,A, C2 A,2 | E,B, G2 A,,E, A,C |
 D,,A,, D,F, A,2 F,2 | G,,D, G,B, D2 B,2 | C,G, CE G2 E2 | G,,D, G,B, D2 B,2 |
 A,,E, A,C E2 C2 | G,,D, B,2 C,G, _B,E | F,,C, F,A, C2 A,2 | E,B, G2 A,,E, A,C |
 D,,A,, D,F, A,2 F,2 | G,,D, G,B, D2 B,2 | C,G, C E4- E/ z/ | C,,2 (24:17:2C,,,8 z/ |]

`;
</script>
