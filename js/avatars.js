// Avatary: systémové obrázky iPhonu (emoji), fungují offline. Vybrala je dcera (krok 3).
export const AVATARS = [
  { id: 'guitar', emoji: '🎸' },
  { id: 'fox', emoji: '🦊' },
  { id: 'cat', emoji: '🐱' },
  { id: 'unicorn', emoji: '🦄' },
  { id: 'panda', emoji: '🐼' },
  { id: 'owl', emoji: '🦉' },
  { id: 'frog', emoji: '🐸' },
  { id: 'star', emoji: '⭐' },
];

export const avatarEmoji = (id) => AVATARS.find((a) => a.id === id)?.emoji ?? '';
