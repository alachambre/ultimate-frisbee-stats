# Context
Those are the requirements post phase 3 (who could be seen as a POC for the project, or a small V1 with starting features).

# Requirements - to get realtime data

We want to keep core concepts from V1, unless there is a direct conflict with what's described bellow. In this case, let's discuss it.

## Line
We need to introduce a notion of line alongside team and players:
- A team is made of players and line (Offsense, Defense A, Defense B).
- A line contains players from the team
- A player can be in several lines
- Lines will be used during points to ease player selection (quick access to a group of player)

## Gender & mixity
- We need to know the gender of each player (Man or Woman)
- On a point, we need to know the mixity of the point (Man - 4M 3W, or Woman - 3M 4W)

## Competition
- On a team, we want to be able to create a competition. It will represent for ex a tournament played by the team. 
- A competition is made of a name, a date (start & end), and a description.
- A competition can have 2 status: 
    - Ongoing -> the competition is created with basic informations (above)
    - Completed -> the competition is over

- On a competition, we should be able to select the list of players from the team that will attend this competition. 

## Game
- A game can be created on ongoing competitions.
- A game will have 3 statuses: 
    - Ready to start -> The game is created, and the user can start to enter information (see bellow)
    - Started -> The first point has started (see Point section) - the game chrono starts
    - Ended -> The game is finished (manual action from the user) - the game chrono stops
- On a game, we want to select the players that are actually playing the game (the full team will not play all the games).
- On a game, we want to be able to add optional comments at any time.

### During a game
- While a game is running, I want to know the number of point played by player, and the effective time on the field (based on point durations).
    - Only completed points of the current game are took into account.

## Strategy
- We want to be able to create strategy that we will do during a game (A strategy is bounded to a team)
- Basically, a strategy will be a name, a description and a category (Offense / Defense)

## Point
- A point will have 4 statuses: 
    - Ready to start -> The point is created, and the user can start to enter information (see bellow)
    - Running -> The pull has been launched (the user clicked on a button on the UI) - the point chrono starts
    - Scored -> The game point has been scored (manual action form the user) - the point chrono stops. 
        - This can be canceled (manual action form the user, in case something happens on the field) - the point chrono restarts, the status comes back to Running (it should clear the endDate of the point if already persisted).
    - Completed -> The point is definitively finished (manual action from the user, after scored), we can switch to the next point. A completed point cannot be resumed. 

- On a point, we want to know on which side of the field we started the point (left or right of the score table)
- On a point, we want to specify the strategy used to start the point.
- On a point, we want to be able to add optional comments at any time.

### During a point
- On a started point, we want to specify if the pull landed inside or outside the field (no matter if we started in offense or in defense).
- On a point, we want to be able to create calls on the fly (see Call section)
- On a point, we want to be able to create turnoverss on the fly (see Turnover section)

## Call
- A call can be created on a running point, to reflect something happening on the field (a foul for ex).
- When a call is started, the call chrono starts
- When a call is completed (i.e the disc is live), the call chrono stops
- On a call, we want to be able to add optional comments at any time.
- The idea in the end is to deduce call durations from point durations, to know the effective duration of each point, and so how long players have been playing.

## Turnover
- A turnover can be created on a running point, to indicates that a turnover occured on the field. 
- When a turnovers happen and our team is in offense (depends on how we started the point, and previous turnovers), we want to be able to select the player responsible of the turnover (from the pool of players playing the point).
- We want to be able to add an optional comment on a turnover.

# Statistics - to analyse data

In the previous section, we defined the requirements on the app that will allow us to store many data from our games. In this section, we will define what we will want to do with those data. 
All the points bellow should be available at game level / competition level / general level. 

## Team

### Offense

- Number & percentile of points scored when starting in offense
- Number & percentile of points scored when starting in offense without any turnover
- Number & percentile of points lost when starting in offense (break from the opponent)

### Defense

- Number & percentile of point with at least one turnover when starting in defense
- Number & percentile of point scored without any turnover from our team  when starting in defense
- Number & percentile of point scored when starting in defense but with turnover from our team
- Number & percentile of point scored by the opponent without turnover

## Players

- Number of point played
- Effective time of play (sum of points duration - sum of calls duration)

### Offense

- Percentile of point scored against all points played when starting in offense
- Percentile of point scored without turn against all points scored when starting in offense
- Percentile of point lost against all points played when starting in offense

### Defense

- Percentile of points with at least one turnover against all points played when starting in defense
- Percentile of points scored against all points played when starting in defense
- Percentile of points scored by the opponent without any turnover against all points played when starting in defense

---

# Questions from Claude (2026-01-20)

## Q1: Competition & Games
- Can you create a game **without** a competition? Or must all games belong to a competition?
- If games must belong to competitions, should we have a concept of a "default" or "general" competition?

-> A games belong to a competition, created by the user. If the user want a general competition he can create one.

## Q2: Point Status & Outcome
- The 4 statuses (Ready → Running → Scored → Completed) track the lifecycle, but how do we capture **who won the point**?
- Is that determined during the "Scored → Completed" transition? (e.g., button says "We scored" vs "They scored"?)
- Or is there a separate field like `won_point: bool` alongside the status?

-> I think that in the db model, we should still see the point from our perspective. So a boolean saying if we won the point or not should be enough, it this was the last question.
Regarding the user flow your suggestion is good: 
- When the point is still ongoing, the user as a button to finish the point (something like point scored).
- Clicking on this button switch the status to Scored
- When the status is scored, 3 buttons should be available: - they scored, we scored, resume point.
    - Ideally, we could guess who scored by checking who started in offense and the amount of turnover. But if the user forgot to enter a turnover, or if he didn't have the time before the end of the point, it won't work. So better to keep this manual. 
- selection they scored or we scored complete the point for good.

## Q3: Point - Field Side
- "On which side of the field we started the point (left or right)" - can you clarify what this means?
  - Is it: Physical position relative to score table (literal left/right)?
  - Is it: Related to determining offense/defense?
  - Is it: Something else?
- How does this field side interact with determining offense/defense throughout the point?

-> This is just a requirement from the coach. Basically, on one side of the field there is always a table with the score, at equal distance of the 2 endzone. 
The idea is to know on which endzone we started the point, i.e on which side of the field. So, a quick solution that should work in any situation is to say if we started on the left or on the right of this table. 
-> This is not the most important feature, and I'm not sure what he wants to achieve with this, so let keep this simple for now.

## Q4: Turnover Logic & Offense/Defense Tracking
- To know if we're on offense when a turnover happens, do we:
  - Start with initial offense/defense status (based on what?)
  - Then toggle O/D with each turnover in the point?
- What determines the initial offense/defense status of a point?
- Is it based on: who pulled? who scored last point? user selection?

-> When a user starts a ne wpoint, he says if we start the point in offense or in defense. This is already implemented. This should be enough to know who's in offense at any time during a point, taking into account the potential turnovers.

## Q5: Lines & Mixity
- Should lines have any awareness of gender composition? (e.g., "Men's O-line" pre-configured to help select 4M+3W)
- Or are they just named player groups and mixity is always specified independently per-point?
- Can a line contain mixed genders or should we enforce/suggest gender ratios?

-> Line should just be seen as a group of people, no need to focus on the mixity here.

## Q6: Pull Tracking
- "On a started point, we want to specify if the pull landed inside or outside the field"
- Is this captured:
  - During the "Ready → Running" transition (when pull is thrown)?
  - After the point starts running (user can update anytime)?
- Does pull in/out affect any game logic, or is it purely for statistics?

-> This is just for stats. It should be optional, and can be defined at any time. 