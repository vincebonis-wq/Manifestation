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
    { q: "Mets la fréquence de ce que tu veux, avec assez de puissance et de durée, et cela viendra vers toi.", s: "Kevin Trudeau" },
    { q: "Ton souhait est ton commandement.", s: "Kevin Trudeau" },
    { q: "Dis : « Je le veux — et si ça n'arrive jamais, c'est ok. » Sens-toi bien. Alors les portes s'ouvrent.", s: "Kevin Trudeau" },
    { q: "Les gens échouent parce qu'ils veulent trop fort. Le désir désespéré repousse.", s: "Kevin Trudeau" },
    { q: "Deviens si concentré sur ta vision que tu n'aies plus le temps de douter.", s: "—" },
    { q: "La chance, c'est ce qui arrive quand la préparation rencontre l'opportunité.", s: "Sénèque" },
    { q: "Agis comme si ce que tu fais faisait une différence. C'est le cas.", s: "William James" },
    { q: "La discipline est le pont entre les objectifs et les accomplissements.", s: "Jim Rohn" },
    { q: "Tu deviens ce à quoi tu penses la plupart du temps.", s: "Earl Nightingale" },
    { q: "Tu ne manifestes pas ce que tu veux — tu manifestes ce que tu ES.", s: "Neville Goddard" },
    { q: "La clarté précède la maîtrise. Vois-le, puis deviens-le.", s: "—" },
  ],

  /* --- Kevin Trudeau · Your Wish Is Your Command --- */

  /* Formule de manifestation en 4 étapes */
  desireSteps: [
    { key:'desire',    n:'1', label:'Désir',   hint:"Sois cristallin. Précis, mesurable, daté — mais assez crédible pour y croire.",
      ph:"Ex : Le 30 juin, mon business génère 20 000 € par mois." },
    { key:'belief',    n:'2', label:'Croyance', hint:"Un savoir profond que c'est possible POUR TOI. Choisis une preuve, un exemple réel.",
      ph:"Ex : D'autres l'ont fait de zéro. Je suis capable et je le mérite." },
    { key:'expectancy',n:'3', label:'Attente',  hint:"La certitude calme que c'est DÉJÀ en route — comme tu attends le lever du soleil.",
      ph:"Ex : C'est fait. Ça arrive à moi, naturellement, au bon moment." },
    { key:'action',    n:'4', label:'Action inspirée', hint:"L'action devient évidente une fois les 3 étapes posées. Quel premier pas fais-tu ?",
      ph:"Ex : Aujourd'hui, je contacte 3 prospects idéaux." },
  ],

  /* Induction thêta (la « fréquence de l'abondance ») — lignes du compte à rebours */
  thetaScript: [
    "Ferme les yeux. Relâche les épaules, la mâchoire.",
    "Respire lentement… l'expiration plus longue que l'inspiration.",
    "À chaque expiration, tu descends d'un cran, plus profond.",
    "Ton mental ralentit. Tu passes du bêta (agitation) au thêta.",
    "C'est ici, dans le calme, que ta commande est entendue.",
    "Tu es détendu, ouvert, réceptif. La fréquence est prête.",
  ],

  /* Étapes de la visualisation « chargée » (fréquence + puissance + durée) */
  vizPromptsPlus: [
    "Vois ta scène : ton désir est DÉJÀ réalisé. Où es-tu ?",
    "Ajoute les détails : couleurs, lumière, sons, présences.",
    "Monte la PUISSANCE : ressens la joie, la fierté, la gratitude, à fond.",
    "Ancre le sentiment dans ton corps. Amplifie-le encore.",
    "Dis intérieurement : « C'est à moi. Je suis déjà cette personne. »",
    "Tiens la DURÉE : reste dans cette émotion, laisse-la t'imprégner.",
    "Maintenant, LÂCHE. « Je le veux, et tout va bien. » Souris.",
  ],

  /* Détachement / lâcher-prise (fin de séance) */
  releaseLines: [
    "Je le veux profondément — et si ça n'arrive jamais, tout va bien.",
    "Je confie ma commande. Je n'ai plus à la porter.",
    "Je me sens bien maintenant, quoi qu'il arrive. C'est réglé.",
  ],

  /* Teachability Index — 2 axes (Trudeau) */
  teachability: {
    intro: "Ta capacité à manifester dépend de deux volontés. Évalue-toi honnêtement, aujourd'hui.",
    axes: [
      { key:'learn',  label:"Volonté d'APPRENDRE", hint:"Suis-je ouvert à de nouvelles idées, sans tout rejeter ni tout gober ?" },
      { key:'change', label:"Volonté de CHANGER",  hint:"Suis-je prêt à modifier mes habitudes, mes croyances, mes actions ?" },
    ],
    note: "80+ = terrain fertile pour manifester. En dessous, commence par assouplir la volonté la plus basse.",
  },

  /* Rituels quotidiens — l'ossature de la journée */
  rituals: [
    { id: 'gratitude',  icon: '☼', title: 'Gratitude',        sub: '3 choses pour lesquelles je suis reconnaissant',       route: '#/ritual/gratitude' },
    { id: 'm369',       icon: '❸', title: 'Méthode 369',       sub: 'Écris ton affirmation 3× / 6× / 9×',                    route: '#/ritual/m369' },
    { id: 'viz',        icon: '◉', title: 'Visualisation',     sub: 'Deviens ton futur moi, 2 min, comme réel',              route: '#/ritual/viz' },
    { id: 'scripting',  icon: '✎', title: 'Scripting',         sub: 'Écris ta réalité au présent',                          route: '#/ritual/scripting' },
    { id: 'action',     icon: '➤', title: 'Action identitaire', sub: 'LA preuve concrète de qui tu deviens',                route: '#/ritual/action' },
  ],

  /* Loi de l'assumption / identité (inspiré Quantum Leap · Neville Goddard) */
  identityPrompts: [
    "Qui est la personne qui a DÉJÀ ce que tu désires ? Décris son identité.",
    "Comment cette personne pense-t-elle, parle-t-elle, se comporte-t-elle au quotidien ?",
    "Qu'est-ce qu'elle ne tolère plus ? Qu'est-ce qu'elle a arrêté de faire ?",
    "Quelle décision prendrais-tu aujourd'hui si tu étais déjà cette personne ?",
  ],
  identityStarters: [
    "Je suis quelqu'un qui…",
    "L'argent et moi, c'est…",
    "Face aux obstacles, je…",
    "Je mérite…",
  ],

  /* Échelle de fréquence / conscience (adaptée de la Carte de Hawkins) */
  frequency: [
    { i:0, label:'Honte / Culpabilité', emoji:'😔', color:'#c0392b' },
    { i:1, label:'Peur / Anxiété',      emoji:'😰', color:'#e0692e' },
    { i:2, label:'Colère / Frustration',emoji:'😤', color:'#e79a24' },
    { i:3, label:'Désir / Manque',      emoji:'😣', color:'#d9c331' },
    { i:4, label:'Courage (le seuil)',  emoji:'🔥', color:'#5cae3f' },
    { i:5, label:'Acceptation / Calme', emoji:'🙂', color:'#2fa08c' },
    { i:6, label:'Amour / Joie',        emoji:'💛', color:'#3a7bd0' },
    { i:7, label:'Paix / Gratitude',    emoji:'✨', color:'#7a5fd0' },
  ],
};
