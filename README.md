# QPo
Q-Po (A strategy game written in JavaScript)


## ABOUT THE GAME

Q-Po is a minimalist real-time-strategy (RTS) game written in JavaScript.

A demo of the game can be viewed at https://youtu.be/mzpa8PNgBVU

The game consists of two teams of colored squares (red and blue) placed on opposing halves of a small grid. Teams score points by destroying enemy units or by moving into the enemy's "end zone."

Each turn is less than two seconds long. Each turn, a player must give an order to each of his or her units. Units can A) move in one of four directions, B) shoot, C) deploy a bomb, or D) do nothing. Depending on the game settings, a player may control a single unit (good for beginners) or multiple units. The size of the grid may also be varied in the settings.


## TECHNOLOGIES SUMMARY

**Graphics:** The game is built on Raphael, a JavaScript library which uses CSS transforms to manipulate SVG HTML elements.

**Networking:** The game is hosted at http://akadjg.com. The user database was created with MongoDB and network interactions occur via Node.

**AI:** The game has a neural-network based AI created with Andrej Karpathy's ConvNetJS. It also has a scripted AI.


## MISCELLANEOUS NOTES

The project's deep history can be found here: https://github.com/djminkus/Q-Po-old
