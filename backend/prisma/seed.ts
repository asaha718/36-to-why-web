import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const questions = [
  // Set 1
  { set: 1, text: 'Given the choice of anyone in the world, whom would you want as a dinner guest?' },
  { set: 1, text: 'Would you like to be famous? In what way?' },
  { set: 1, text: 'Before making a telephone call, do you ever rehearse what you are going to say? Why?' },
  { set: 1, text: 'What would constitute a "perfect" day for you?' },
  { set: 1, text: 'When did you last sing to yourself? To someone else?' },
  { set: 1, text: 'If you were able to live to the age of 90 and retain either the mind or body of a 30-year-old for the last 60 years of your life, which would you want?' },
  { set: 1, text: 'Do you have a secret hunch about how you will die?' },
  { set: 1, text: 'Name three things you and your partner appear to have in common.' },
  { set: 1, text: 'For what in your life do you feel most grateful?' },
  { set: 1, text: 'If you could change anything about the way you were raised, what would it be?' },
  { set: 1, text: 'Take four minutes and tell your partner your life story in as much detail as possible.' },
  { set: 1, text: 'If you could wake up tomorrow having gained any one quality or ability, what would it be?' },
  // Set 2
  { set: 2, text: 'If a crystal ball could tell you the truth about yourself, your life, the future, or anything else, what would you want to know?' },
  { set: 2, text: 'Is there something that you\'ve dreamed of doing for a long time? Why haven\'t you done it?' },
  { set: 2, text: 'What is the greatest accomplishment of your life?' },
  { set: 2, text: 'What do you value most in a friendship?' },
  { set: 2, text: 'What is your most treasured memory?' },
  { set: 2, text: 'What is your most terrible memory?' },
  { set: 2, text: 'If you knew that in one year you would die suddenly, would you change anything about the way you are now living? Why?' },
  { set: 2, text: 'What does friendship mean to you?' },
  { set: 2, text: 'What roles do love and affection play in your life?' },
  { set: 2, text: 'Alternate sharing something you consider a positive characteristic of your partner. Share a total of five items.' },
  { set: 2, text: 'How close and warm is your family? Do you feel your childhood was happier than most other people\'s?' },
  { set: 2, text: 'How do you feel about your relationship with your mother?' },
  // Set 3
  { set: 3, text: 'Make three true "we" statements each. For instance, "We are both in this room feeling ..."' },
  { set: 3, text: 'Complete this sentence: "I wish I had someone with whom I could share ..."' },
  { set: 3, text: 'If you were going to become a close friend with your partner, please share what would be important for him or her to know about you.' },
  { set: 3, text: 'Tell your partner what you like about them; be very honest this time, saying things that you might not say to someone you\'ve just met.' },
  { set: 3, text: 'Share with your partner an embarrassing moment in your life.' },
  { set: 3, text: 'When did you last cry in front of another person? By yourself?' },
  { set: 3, text: 'Tell your partner something that you like about them already.' },
  { set: 3, text: 'What, if anything, is too serious to be joked about?' },
  { set: 3, text: 'If you were to die this evening with no opportunity to communicate with anyone, what would you most regret not having told someone? Why haven\'t you told them yet?' },
  { set: 3, text: 'Your house, containing everything you own, catches fire. After saving your loved ones and pets, you have time to safely make a final dash to save any one item. What would it be? Why?' },
  { set: 3, text: 'Of all the people in your family, whose death would you find most disturbing? Why?' },
  { set: 3, text: 'Share a personal problem and ask your partner\'s advice on how he or she might handle it. Also, ask your partner to reflect back to you how you seem to be feeling about the problem you have chosen.' },
]

async function main() {
  console.log('Seeding questions...')
  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: questions.indexOf(q) + 1 },
      update: { set: q.set, text: q.text },
      create: { set: q.set, text: q.text },
    })
  }
  console.log(`Seeded ${questions.length} questions.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
