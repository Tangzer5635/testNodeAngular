export const fauxJeton = (contenu: object): string => {
  const octets = new TextEncoder().encode(JSON.stringify(contenu));
  const base64 = btoa(String.fromCharCode(...octets)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `entete.${base64}.signature`;
};

export const jetonDe = (
  role: 'admin' | 'client',
  { nom = 'Léa Martin', email = 'lea@test.fr', dansSecondes = 3600 } = {}
): string => fauxJeton({ sub: 7, email, nom, role, exp: Math.floor(Date.now() / 1000) + dansSecondes });
