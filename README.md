# SipStreak: HydroHero Hunt (HTML + CSS + JavaScript version)

A plain front-end version of the project. No build step, no libraries, no server.

## Run
Double-click `index.html`, or serve the folder (for example `npx serve .`) and open the address.
Data is stored in your browser (localStorage). Use **Log in as Priya (demo)** to try it at once.

## Files
| File | Purpose |
| --- | --- |
| `index.html` | Page shell: header, navigation, content area |
| `css/style.css` | Dark glass theme, layout, responsive rules |
| `js/calc.js` | Scoring logic: daily goal, caffeine rule, fair team score, ranking, streaks |
| `js/data.js` | localStorage database, sample squads, sign-up/log-in, water and squad actions |
| `js/bottle.js` | Animated water bottle drawn on a canvas |
| `js/app.js` | Pages, routing (#hash), forms and click handling, history chart |

## Rules implemented
* Daily goal = body weight x 35 ml (rounded to 10 ml), or a custom goal.
* Caffeine rule: each coffee / energy drink adds 200 ml to that day's goal.
* Team score = average of every member's `min(1, intake / goal)` x 100.
* A squad holds at most 8 people and is joined with a 6-character invite code.
* Demo story: Hostel Block B is at 72%; one +500 ml tap by Priya lifts it to 78%, past Block A (75%).
