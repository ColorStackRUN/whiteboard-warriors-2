<div align="center">

# ⚔️ Whiteboard Warriors #2

### Think big. Draw boldly. Design what’s next.

![Live System Design](https://img.shields.io/badge/Live-System%20Design-7C3AED?style=for-the-badge&logo=diagrams.net&logoColor=white)
![ColorStack RUN](https://img.shields.io/badge/ColorStack-RUN-FF4F00?style=for-the-badge&logo=rocket&logoColor=white)
![Bring your ideas](https://img.shields.io/badge/Bring-Your%20Ideas-00BFA6?style=for-the-badge&logo=lightbulb&logoColor=white)

**An interactive ColorStack RUN event where we turn ambitious ideas into systems that can actually work.**

`Learn it` · `Sketch it` · `Defend it` · `Build confidence`

</div>

---

## Animated campus lost-and-found demo

The workshop's worked example is now a runnable, browser-based teaching demo in [`demo/`](demo/). It uses the deck's blue visual direction and shows a moving request traveling between a website, backend, database, and photo storage.

### Run it

Install Node.js 20 or newer. No packages, account, or API keys are required.

```sh
npm run dev
```

Open the local address printed in the terminal (normally `http://127.0.0.1:4173`). Run the model checks with `npm test`.

### Present it in seven minutes

1. Play **Post an item**. Explain why the database stores a photo reference while file storage holds the image.
2. Switch to **Find it**. Trace a basic search and the response back to the website.
3. Switch to **Who can edit?**. Show the simulated backend refusing a non-owner's return request.
4. Try the app below: post a found item, upload a photo or use the sample illustration, search listings, and mark your own item returned. Switch sample students to test a denied update.
5. Open **Peek at the stored data** to compare listing records with photo files. Discuss the tradeoffs of separate photos, one backend, and basic search.

Use Pause and Next step to set the pace. Less motion is available, and the demo honors the operating system's reduced-motion preference. The explanatory walkthroughs use an isolated sample model and do not change the app's listings. Actions in the app generate a trace of the operation that just completed.

### What this demo does and does not implement

- Posts contain a description, category, location, owner, status, and photo reference.
- Photos live in a separate logical file collection. Records contain references rather than image bytes.
- The teaching model checks ownership when changing an item to returned, independently of which button the page displays.
- Listings and uploaded images persist **only in this browser's local storage**, not in a shared campus database. Reset removes the demo's added records and photos from that browser.
- **All four components are simulated in browser JavaScript. There is no deployed backend, real database, object-storage service, or authentication.** Switching Maya/Jordan is a teaching control, not a security boundary. Users can inspect or change browser data. A real service must verify signed-in identity and enforce permissions on a trusted server.
- Sample students, items, locations, and illustrations are fictional teaching data. Do not upload sensitive photos or use the demo to report actual lost property.
- Uploads accept PNG, JPEG, and WebP up to 2 MB. Browser storage limits may prevent large or numerous uploads. A failed save leaves the prior model unchanged.

The static files can also be served from any static host, including GitHub Pages. Hosting is not automatically enabled by this change. The repository includes dependency-free model tests. The movie-booking challenge remains unsolved here so teams can design it themselves.

---

## The challenge

You and your team will get a poster, a marker, and one familiar product to design from the ground up. There is no laptop requirement, no “perfect” answer, and no need to know every technology in the room.

Your mission is to think like an engineer:

> How does this product work for real people—and what happens when everybody uses it at once?

You can work solo or form a squad. Map the user experience, make smart assumptions, sketch the building blocks, and explain the choices behind your design. At the end, we’ll unpack the strongest ideas together.

## Why system design still matters

AI can help us build faster than ever. It can generate components, write API routes, explain unfamiliar code, and turn a rough idea into a prototype in minutes.

But AI does not automatically know **what should be built**, **what matters most**, or **what tradeoffs your users need you to make**.

That is where system design comes in.

System design is the skill of taking a big, messy idea and turning it into a thoughtful plan. It means asking the questions that shape great products:

- Who is this for, and what problem are we solving?
- What needs to happen first for the product to be useful?
- What information do we need to store and protect?
- What happens during the busiest moment of the day?
- How do we make the experience reliable, accessible, and worth coming back to?

The engineers who stand out in an AI-powered world will not just prompt tools to write code. They will have the judgment to guide those tools, challenge weak assumptions, and design systems that serve people well.

<div align="center">

### ✦ AI can accelerate the build. **You** set the direction. ✦

</div>

## Why it matters for interviews

System design is a common part of technical interviews—especially as you grow into internships, new-grad roles, and beyond. Interviewers are not looking for a memorized list of buzzwords.

They want to see how you think:

| They’re listening for… | You’ll practice… |
| :--- | :--- |
| Clear communication | Explaining your decisions out loud |
| Product thinking | Starting with users and requirements |
| Problem-solving | Breaking a big challenge into smaller pieces |
| Technical judgment | Discussing tradeoffs instead of chasing one “right” answer |
| Collaboration | Building on ideas with a team |

Whiteboard Warriors is a low-stakes place to build that muscle. You do not need to arrive as a system-design expert. You just need curiosity and the willingness to put your thinking on the board.

## What to expect

| Time | What we’re doing |
| :--- | :--- |
| **Kickoff** | A practical, beginner-friendly intro to live system design |
| **The design brief** | Meet the product, the users, and the problem your team will solve |
| **Whiteboard round** | Turn your poster into a product plan—solo or with your team |
| **The twist** | Adapt when we introduce a real-world constraint |
| **Show & tell** | Share your approach, celebrate creative solutions, and learn from one another |

### Come as you are

Whether you are new to tech, sharpening your interview skills, or already building projects, there is a place for you at the board. Bring your questions, your ideas, and your willingness to draw something imperfect.

<div align="center">

## Ready to become a Whiteboard Warrior?

### Your next great idea starts with one marker stroke. 🖊️

**#ColorStackRUN · #WhiteboardWarriors**

</div>
