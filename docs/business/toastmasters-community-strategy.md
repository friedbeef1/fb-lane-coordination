# Meja: Toastmasters Community Acquisition & Positioning Strategy

This document defines the positioning, copywriting, product scenarios, and outreach templates to acquire Toastmasters members globally. Toastmasters clubs represent the ideal beachhead market: highly motivated speakers who actively seek practice, tracking, and evaluation.

---

## 1. Product Positioning: Meja for Toastmasters

Meja serves as the ultimate **automated practice buddy** before members stand up in front of their club. It maps directly to core Toastmasters meeting roles:

| Meeting Role | Meja Feature | Value Proposition |
|---|---|---|
| **Ah-Counter** | Real-time Filler Word Tracker | Tracks "ah," "um," "like," "you know," and "so" with high precision to help speakers eliminate verbal crutches. |
| **Timer** | Active Segment Timer | Monitors speech duration with color-coded alerts to ensure speeches fit the strict club time limits. |
| **Grammarian** | AI Pacing & Vocabulary Auditor | Highlights vocabulary use, grammar errors, and sentence structure. |
| **Speech Evaluator** | AI Speech Evaluation Rubric | Delivers immediate, constructive feedback using the standard Toastmasters evaluation method. |
| **Table Topics Master** | Impromptu Prompt Generator | Generates random, thought-provoking questions to practice impromptu speaking. |

---

## 2. Proposed Product Scenarios (for `scenarios.ts`)

This new **Toastmasters** category is designed to help members practice common club roles and speech formats. 

### Category Title: `Toastmasters`
* **Category Description**: Practice impromptu speaking, Pathways speeches, and evaluations.

```typescript
{
  id: 'toastmasters-table-topics',
  title: 'Table Topics Practice',
  description: 'Master impromptu speaking with 1-2 minute responses.',
  icon: 'chatBubble',
  prompts: [
    "If you could have dinner with any historical figure, who would it be and why?",
    "What is the most valuable piece of advice you have ever received?",
    "If you were given a million dollars to start a community project, what would you build?",
    "Describe a challenge that turned out to be a blessing in disguise.",
    "What does leadership mean to you in your personal or professional life?"
  ],
  tips: [
    "- Use the PREP framework: State your Point, give a Reason, share an Example, and restate your Point.\n- Take a 2-3 second pause before speaking to structure your thoughts.\n- Aim to speak for at least 1 minute (green light) and wrap up by 2 minutes.",
    "- Pick one simple advice and tell a story about how it changed your behavior.\n- Avoid trying to cover too many points; focus on one strong message.",
    "- Start with a clear vision ('I would build...').\n- Break it down into: Who it helps, how it works, and the ultimate impact.\n- Conclude with a call to action or a vision of the completed project.",
    "- Start directly with the conflict or challenge to hook your listener.\n- Show the turning point clearly.\n- End by summarizing the lesson learned.",
    "- Define leadership in your own words (e.g., 'Leadership is not about status, it is about...').\n- Give a brief story of someone who modeled this style.\n- Wrap up by connecting it back to how everyone can lead."
  ]
},
{
  id: 'toastmasters-ice-breaker',
  title: 'Ice Breaker Speech',
  description: 'Practice your very first 4-6 minute Pathways speech.',
  icon: 'presentation',
  prompts: [
    "Good evening, Toastmasters and guests. Today, I want to introduce myself by sharing...",
    "A major milestone or defining experience in my early life was...",
    "This experience shaped my perspective and led me to where I am today, which is...",
    "I decided to join Toastmasters because...",
    "Thank you, and I look forward to growing alongside all of you."
  ],
  tips: [
    "- Speak clearly and keep your pacing comfortable.\n- Smile and make virtual/physical eye contact.\n- Keep this opening story simple and authentic.",
    "- Focus on one specific event rather than a dry list of facts.\n- Describe what you felt, saw, and learned during this moment.\n- Keep it engaging, like you're talking to a friend.",
    "- Bridge your past experience to your present professional or personal status.\n- Show how that milestone influenced your values or career choice.",
    "- Be honest about your public speaking fears or career goals.\n- Showing vulnerability helps build a strong connection with your club members.",
    "- Conclude with a brief summary of your message.\n- End with a strong statement of commitment or enthusiasm."
  ]
},
{
  id: 'toastmasters-pathways-speech',
  title: 'Pathways Speech Practice',
  description: 'Structure and refine your standard 5-7 minute speech.',
  icon: 'presentation',
  prompts: [
    "Hook your audience: Start with a powerful quote, a shocking statistic, or a personal question.",
    "Introduce your core message and outline the three main points of your speech.",
    "Detail your first point, supporting it with a story, example, or data.",
    "Transition to your second and third points, maintaining a logical flow.",
    "Conclude with a summary and a strong, memorable call to action."
  ],
  tips: [
    "- Avoid starting with 'Hello' or 'Today I will talk about'. Go straight into the hook.\n- Use a dramatic pause after your hook to let it sink in.",
    "- State your purpose in a single, clear sentence.\n- Give the audience a roadmap of what to expect so they can follow easily.",
    "- Use descriptive language to bring your story to life.\n- Vary your pacing and volume to highlight key parts of the story.",
    "- Use clear transition words (e.g., 'This brings us to...', 'On the other hand...').\n- Maintain a steady rhythm and watch your timer.",
    "- Reiterate your core message.\n- Never introduce new points in the conclusion.\n- End on a high note and return control to the Toastmaster."
  ]
},
{
  id: 'toastmasters-evaluation',
  title: 'Speech Evaluation Practice',
  description: 'Deliver a structured 2-3 minute speech evaluation.',
  icon: 'chatBubble',
  prompts: [
    "I had the pleasure of evaluating [Speaker's Name] today. What I loved most about your speech was...",
    "Specifically, your delivery was excellent in these areas...",
    "To take your speech to the next level, I suggest focusing on...",
    "Another area for potential growth is...",
    "In summary, you delivered a wonderful speech. If you apply these tips, I know you will excel."
  ],
  tips: [
    "- Use the 'sandwich method': praise, constructive suggestions, praise.\n- Speak directly to the speaker but address the audience too.\n- Start with immediate positive feedback to build their confidence.",
    "- Focus on specific delivery mechanics: eye contact, body language, vocal variety, or slide usage.\n- Give concrete examples of what they did well (e.g., 'When you paused after...').",
    "- Frame your advice as a constructive suggestion rather than a criticism (e.g., 'I recommend...' instead of 'You shouldn't...').\n- Keep suggestions actionable and realistic.",
    "- Limit yourself to 1-2 constructive points so the speaker isn't overwhelmed.\n- Explain *how* to implement the suggestion.",
    "- Reiterate the positive highlights.\n- End with an encouraging statement to motivate them for their next speech."
  ]
}
```

---

## 3. Outreach & Community Building Templates

### Template A: Cold Outreach to Club Officers (President / VP Education)
**Subject**: Free AI speech practice tool for [Club Name] members

```
Hi [First Name],

I hope you’re having a great week! 

I’m the founder of Meja (meja.app), an AI-powered speech coach designed to help speakers practice their speeches, track filler words, and polish their timing before stepping on stage.

As a fan of the Toastmasters program, I know how valuable structured feedback is. We built Meja to act as an automated, 24/7 "Ah-Counter & Timer" so members can practice their Table Topics and Pathways speeches at home and walk into club meetings feeling 10x more confident.

We are currently launching Meja to select Toastmasters clubs around the world. We’d love to offer the officers and members of [Club Name] free early access to our platform. 

Would you be open to sharing this with your members, or perhaps letting us do a quick 3-minute demonstration during your next meeting's Table Topics or Evaluation segment?

Looking forward to hearing your thoughts!

Best regards,

[Your Name]  
Founder, Meja  
[Contact Information / Link]
```

### Template B: Discord/Slack Community Welcome Message
**Channel**: `#toastmasters-lounge`
**Topic**: Share speech drafts, practice Table Topics, and get tips.

```
👋 Welcome to the Meja Toastmasters Lounge!

This is a dedicated space for Toastmasters members from around the world to connect, practice, and refine their communication skills. 

Here is how you can get started:
1. 🎤 **Introduce Yourself**: Share your name, your home club name, and which Pathways path you are currently working on!
2. 🤖 **Practice with Meja**: Try out our new Toastmasters Scenarios (Table Topics, Ice Breaker, Speech Practice, and Evaluations).
3. 📈 **Share Your Wins**: Did you nail a speech, win Best Table Topics speaker, or reduce your filler word count? Post it in #wins!
4. 💡 **Request Feedback**: Have a speech you're practicing? Share your Meja analysis results link here for peer tips and encouragement.

Let's support each other in becoming confident, fluent communicators! 🚀
```
