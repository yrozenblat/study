export const QUESTIONS = {
  a_an: [
    {
      id: 'aa01',
      sentence: '___ apple',
      options: ['a', 'an'],
      correct: 'an',
      rule: 'לפני צליל שמתחיל באות ניקוד (a, e, i, o, u) משתמשים ב-an.'
    },
    {
      id: 'aa02',
      sentence: '___ orange',
      options: ['a', 'an'],
      correct: 'an',
      rule: 'orange מתחיל בצליל של אות ניקוד, לכן צריך an.'
    },
    {
      id: 'aa03',
      sentence: '___ egg',
      options: ['a', 'an'],
      correct: 'an',
      rule: 'egg מתחיל ב-e, לכן משתמשים ב-an.'
    },
    {
      id: 'aa04',
      sentence: '___ umbrella',
      options: ['a', 'an'],
      correct: 'an',
      rule: 'umbrella מתחיל בצליל /ʌ/ (אות ניקוד), לכן an.'
    },
    {
      id: 'aa05',
      sentence: '___ avocado',
      options: ['a', 'an'],
      correct: 'an',
      rule: 'avocado מתחיל ב-a, אות ניקוד, לכן an.'
    },
    {
      id: 'aa06',
      sentence: '___ pencil',
      options: ['a', 'an'],
      correct: 'a',
      rule: 'pencil מתחיל בעיצור p, לכן משתמשים ב-a.'
    },
    {
      id: 'aa07',
      sentence: '___ computer',
      options: ['a', 'an'],
      correct: 'a',
      rule: 'computer מתחיל בעיצור c, לכן a.'
    },
    {
      id: 'aa08',
      sentence: '___ box',
      options: ['a', 'an'],
      correct: 'a',
      rule: 'box מתחיל בעיצור b, לכן a.'
    },
    {
      id: 'aa09',
      sentence: '___ mango',
      options: ['a', 'an'],
      correct: 'a',
      rule: 'mango מתחיל בעיצור m, לכן a.'
    },
    {
      id: 'aa10',
      sentence: '___ eraser',
      options: ['a', 'an'],
      correct: 'an',
      rule: 'eraser מתחיל ב-e, לכן an.'
    }
  ],

  am_is_are: [
    {
      id: 'be01',
      sentence: 'I ___ ten years old.',
      options: ['am', 'is', 'are'],
      correct: 'am',
      rule: 'עם I משתמשים ב-am.'
    },
    {
      id: 'be02',
      sentence: 'She ___ my sister.',
      options: ['am', 'is', 'are'],
      correct: 'is',
      rule: 'עם she / he / it משתמשים ב-is.'
    },
    {
      id: 'be03',
      sentence: 'They ___ in the park.',
      options: ['am', 'is', 'are'],
      correct: 'are',
      rule: 'עם we / you / they משתמשים ב-are.'
    },
    {
      id: 'be04',
      sentence: 'We ___ friends.',
      options: ['am', 'is', 'are'],
      correct: 'are',
      rule: 'עם we משתמשים ב-are.'
    },
    {
      id: 'be05',
      sentence: 'It ___ a nice day.',
      options: ['am', 'is', 'are'],
      correct: 'is',
      rule: 'It בגוף שלישי יחיד – לכן is.'
    },
    {
      id: 'be06',
      sentence: 'You ___ at school now.',
      options: ['am', 'is', 'are'],
      correct: 'are',
      rule: 'עם you משתמשים ב-are.'
    },
    {
      id: 'be07',
      sentence: 'My mother and father ___ at work.',
      options: ['am', 'is', 'are'],
      correct: 'are',
      rule: 'נושא ברבים – לכן are.'
    },
    {
      id: 'be08',
      sentence: 'He ___ not hungry.',
      options: ['am', 'is', 'are'],
      correct: 'is',
      rule: 'He בגוף שלישי יחיד – therefore is.'
    },
    {
      id: 'be09',
      sentence: 'We ___ not tired.',
      options: ['am', 'is', 'are'],
      correct: 'are',
      rule: 'We – בגוף ראשון רבים – לכן are.'
    },
    {
      id: 'be10',
      sentence: 'I ___ in grade five.',
      options: ['am', 'is', 'are'],
      correct: 'am',
      rule: 'עם I תמיד am.'
    }
  ],

  there_is_are: [
    {
      id: 'th01',
      sentence: '___ a computer on the desk.',
      options: ['There is', 'There are'],
      correct: 'There is',
      rule: 'עם שם עצם יחיד משתמשים ב-There is.'
    },
    {
      id: 'th02',
      sentence: '___ two pencils in the bag.',
      options: ['There is', 'There are'],
      correct: 'There are',
      rule: 'עם שם עצם ברבים (two pencils) משתמשים ב-There are.'
    },
    {
      id: 'th03',
      sentence: '___ some books on the table.',
      options: ['There is', 'There are'],
      correct: 'There are',
      rule: 'some books זה רבים – לכן There are.'
    },
    {
      id: 'th04',
      sentence: '___ a cat on the blanket.',
      options: ['There is', 'There are'],
      correct: 'There is',
      rule: 'a cat – יחיד – לכן There is.'
    },
    {
      id: 'th05',
      sentence: '___ six cars in the street.',
      options: ['There is', 'There are'],
      correct: 'There are',
      rule: 'six cars – רבים – לכן There are.'
    },
    {
      id: 'th06',
      sentence: '___ an egg in the fridge.',
      options: ['There is', 'There are'],
      correct: 'There is',
      rule: 'an egg – יחיד – לכן There is.'
    },
    {
      id: 'th07',
      sentence: '___ some bananas on the plate.',
      options: ['There is', 'There are'],
      correct: 'There are',
      rule: 'bananas – רבים – לכן There are.'
    },
    {
      id: 'th08',
      sentence: '___ a big bus at the station.',
      options: ['There is', 'There are'],
      correct: 'There is',
      rule: 'a big bus – יחיד – לכן There is.'
    },
    {
      id: 'th09',
      sentence: '___ nine red markers in the box.',
      options: ['There is', 'There are'],
      correct: 'There are',
      rule: 'nine red markers – רבים – לכן There are.'
    },
    {
      id: 'th10',
      sentence: '___ some children in the class.',
      options: ['There is', 'There are'],
      correct: 'There are',
      rule: 'children – רבים – לכן There are.'
    }
  ]
};
