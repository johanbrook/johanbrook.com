---
title: 'Object-oriented Programming and Modeling the Real World'
link: 'http://news.ycombinator.com/item?id=5336588'
date: '2013-03-07 09:40'
tags:
  - Code
  - programming
  - Modeling
  - OOP
  - 'domain model'
  - abstraction
  - inheritance
category: Development
---

> Almost everybody begins OOP with this misconception - objects in real world directly map to OOP objects. Its maybe a good place to start but how many grow up from the initial simplistic rule - map nouns in requirements to classes. So, you end up with objects that don't really mean anything and don't do much. Naive use of UML diagrams also leads to this. Discovering abstractions is tricky. One needs to really live with requirements inside out before they present themselves.
From a [Hacker News comment](http://news.ycombinator.com/item?id=5336588) on  [this story about Clojure programming](http://www.lispcast.com/java-learn-from-clojure?utm_source=dlvr.it&utm_medium=twitter). I've seen this myself in school, where we've gone through endless examples of OOP where the classes were a Ball, a Car, a Zebra, or other overused objects in the real world. The thing is, most programming isn't about modeling the real world, _our_ world. When writing code you're free to do things your way, not being tied to the constraints of the real world thinking.  **When we were doing** our first large programming project (which was an awesome 2D game:  ["Frank the Tank"](http://beta.johanbrook.com/medioqre/)), we went straight ahead with a semi-naïve approach when doing the initial domain model. As we went on, more models were thrown in in order to accomodate all possible requirements we had set up. All models were real world things a regular person could understand ("Player, Enemy, MachineGun", etc.). Later on in the modeling stage we started to realize things weren't right. We had represented reality in too fine grained detail, and started to rethink our model from a _computational_ perspective. Thinking in high-level abstractions, working with sensible inheritance and interfaces, we started to re-implement everything the way it should be done in a computer game. It worked very well.  Don't adhere to everything the professors in university says. Then you'll hit a brick wall later on, when you realize the computer's reality isn't a mirror of your own.
