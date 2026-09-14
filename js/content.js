/* =====================================================================
   CONTENT — piliers, affirmations, prompts, protocoles, citations
   Tout en français. Fondé sur les recherches (RAS, visualisation,
   scripting/369, EFT, reframing, action alignée).
   ===================================================================== */

const CONTENT = {

  /* Les piliers de vie (life areas) */
  pillars: [
    { id: 'wealth',   label: 'Richesse & Abondance', icon: '❖' },
    { id: 'career',   label: 'Carrière & Business',  icon: '⚑' },
    { id: 'health',   label: 'Santé & Énergie',      icon: '❂' },
    { id: 'love',     label: 'Relations & Amour',    icon: '❤' },
    { id: 'self',     label: 'Développement de soi', icon: '✧' },
  ],

  /* Bibliothèque d'affirmations (présent, incarné) */
  affirmations: {
    wealth: [
      "L'argent circule vers moi avec facilité et régularité.",
      "Je suis un aimant à opportunités financières.",
      "La richesse est mon état naturel ; je l'accueille pleinement.",
      "Chaque jour, mes revenus augmentent de façon inattendue.",
      "Je mérite l'abondance et je la reçois avec gratitude.",
      "Je gère l'argent avec sagesse et il grandit entre mes mains.",
      "Il existe toujours plus qu'assez pour moi et les miens.",
    ],
    career: [
      "Je construis un business qui a de l'impact et prospère.",
      "Les bonnes personnes et les bonnes portes s'ouvrent à moi.",
      "Je prends des décisions justes, guidées et puissantes.",
      "Mon travail crée une valeur immense et est récompensé à sa hauteur.",
      "Je suis à ma place, au sommet de mon domaine.",
      "Je transforme chaque obstacle en tremplin vers le succès.",
    ],
    health: [
      "Mon corps est fort, sain et débordant d'énergie.",
      "Je respire le calme et je rayonne la vitalité.",
      "Chaque cellule de mon corps se régénère et prospère.",
      "Je prends soin de moi comme d'un être précieux.",
      "Mon énergie est haute, claire et magnétique.",
    ],
    love: [
      "Je suis entouré de relations sincères et nourrissantes.",
      "Je donne et reçois l'amour sans limite.",
      "J'attire des personnes alignées avec ma vision.",
      "Je suis digne d'être aimé profondément, tel que je suis.",
    ],
    self: [
      "Je crée ma réalité par mes pensées et mes actes.",
      "Je suis discipliné, concentré et imparable.",
      "Je deviens chaque jour la meilleure version de moi-même.",
      "Ma confiance est inébranlable ; je fais confiance au processus.",
      "Je suis à la hauteur de mes rêves les plus grands.",
      "Ce que je vise vient à moi, car je suis déjà cette personne.",
    ],
  },

  /* Prompts de scripting (rotation) */
  scriptingPrompts: [
    "Écris ta journée idéale, au présent, comme si elle avait déjà eu lieu. Que ressens-tu ?",
    "Décris ta vie dans 12 mois comme si c'était aujourd'hui. Où es-tu ? Avec qui ? Que fais-tu ?",
    "Raconte le moment précis où ton plus grand objectif se réalise. Les détails, les émotions, les sensations.",
    "Écris une lettre de remerciement à l'Univers pour tout ce que tu as déjà reçu (au présent).",
    "Décris la personne que tu es devenue : ses habitudes, sa posture, sa manière de penser.",
  ],

  /* Prompts de visualisation guidée (défilent pendant la séance) */
  vizPrompts: [
    "Ferme les yeux. Respire. Vois-toi ayant déjà atteint ton objectif.",
    "Où es-tu ? Observe les lieux, les couleurs, la lumière autour de toi.",
    "Qui est là avec toi ? Entends leurs voix, leurs félicitations.",
    "Ressens la fierté, la joie, le soulagement dans ton corps. Amplifie-le.",
    "Que touches-tu ? Que sens-tu ? Rends la scène totalement réelle.",
    "Dis-toi : « C'est déjà à moi. Je suis cette personne. »",
    "Souris. Ancre cette sensation. Elle est ta nouvelle normalité.",
  ],

  /* Protocole EFT (tapping) — points guidés */
  eftPoints: [
    { key: 'kc',  name: "Tranche de la main",  hint: "Point karaté, tranchant de la main" },
    { key: 'eb',  name: "Début du sourcil",    hint: "Coin interne du sourcil" },
    { key: 'se',  name: "Coin de l'œil",       hint: "Os à côté de l'œil" },
    { key: 'ue',  name: "Sous l'œil",          hint: "Os sous la pupille" },
    { key: 'un',  name: "Sous le nez",         hint: "Entre nez et lèvre" },
    { key: 'ch',  name: "Menton",              hint: "Creux sous la lèvre inférieure" },
    { key: 'cb',  name: "Clavicule",           hint: "Sous la clavicule" },
    { key: 'ua',  name: "Sous le bras",        hint: "10 cm sous l'aisselle" },
    { key: 'th',  name: "Sommet du crâne",     hint: "Haut de la tête" },
  ],

  /* Croyances limitantes courantes + reframes suggérés */
  commonBlocks: [
    { b: "Je ne suis pas assez / pas légitime.", r: "Je suis en apprentissage constant et pleinement capable de réussir." },
    { b: "L'argent est difficile à gagner.", r: "L'argent vient à moi par la valeur que je crée avec plaisir." },
    { b: "Réussir, ce n'est pas pour les gens comme moi.", r: "Je décide qui je deviens, et je choisis la réussite." },
    { b: "Si je réussis, on va me juger / m'abandonner.", r: "Ma réussite inspire et rapproche les bonnes personnes." },
    { b: "Je vais échouer / ce n'est pas réaliste.", r: "Chaque tentative m'enseigne ; l'échec n'existe pas, seulement des données." },
    { b: "Je n'ai pas le temps / les moyens.", r: "Je crée le temps et les ressources pour ce qui compte vraiment." },
  ],

  /* Citations premium (rotation quotidienne) */
  quotes: [
    { q: "Ce que l'esprit peut concevoir et croire, il peut le réaliser.", s: "Napoleon Hill" },
    { q: "Deviens si concentré sur ta vision que tu n'aies plus le temps de douter.", s: "—" },
    { q: "La chance, c'est ce qui arrive quand la préparation rencontre l'opportunité.", s: "Sénèque" },
    { q: "Tu ne vois pas le monde tel qu'il est, mais tel que tu es.", s: "Anaïs Nin" },
    { q: "Agis comme si ce que tu fais faisait une différence. C'est le cas.", s: "William James" },
    { q: "La discipline est le pont entre les objectifs et les accomplissements.", s: "Jim Rohn" },
    { q: "Tu deviens ce à quoi tu penses la plupart du temps.", s: "Earl Nightingale" },
    { q: "La clarté précède la maîtrise. Vois-le, puis deviens-le.", s: "—" },
  ],

  /* Rituels quotidiens — l'ossature de la journée */
  rituals: [
    { id: 'gratitude',  icon: '☼', title: 'Gratitude',        sub: '3 choses pour lesquelles je suis reconnaissant',       route: '#/ritual/gratitude' },
    { id: 'm369',       icon: '❸', title: 'Méthode 369',       sub: 'Écris ton affirmation 3× / 6× / 9×',                    route: '#/ritual/m369' },
    { id: 'viz',        icon: '◉', title: 'Visualisation',     sub: '2 min pour vivre ton objectif comme réel',              route: '#/ritual/viz' },
    { id: 'scripting',  icon: '✎', title: 'Scripting',         sub: 'Écris ta réalité au présent',                          route: '#/ritual/scripting' },
    { id: 'action',     icon: '➤', title: 'Action alignée',    sub: 'LA chose concrète qui rapproche ta vision',            route: '#/ritual/action' },
  ],
};
