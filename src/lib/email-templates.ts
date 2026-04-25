import type { CampaignContent, CampaignType } from "@/lib/crm-types";

export type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  subject: string;
  content: CampaignContent;
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "promotion-decouverte",
    name: "Promotion découverte",
    description: "Une réduction pour faire découvrir votre carte",
    type: "promotion",
    subject: "Une attention pour vous, {prenom}",
    content: {
      title: "Une attention pour vous, {prenom}",
      body: "Notre chef a imaginé une carte automnale qui mérite votre table. Pour vous remercier de votre fidélité, profitez de -20% sur le menu signature pendant tout le mois.",
      cta_text: "Réserver ma table",
      cta_url: null,
      image_url: null,
    },
  },
  {
    id: "evenement",
    name: "Annonce d'événement",
    description: "Soirée, dégustation, événement spécial",
    type: "evenement",
    subject: "Soirée d'exception chez {nom_restaurant}",
    content: {
      title: "Soirée œnologie · vendredi prochain",
      body: "Le sommelier Étienne Marchand nous fait l'honneur d'animer une dégustation autour des vins du Rhône. Quatre cuvées rares accompagnées de petites bouchées du chef. Places limitées à 20 convives.",
      cta_text: "Réserver ma place",
      cta_url: null,
      image_url: null,
    },
  },
  {
    id: "fidelite",
    name: "Bonus fidélité",
    description: "Récompense pour les meilleurs clients",
    type: "fidelite",
    subject: "Vos points fidélité, {prenom}",
    content: {
      title: "Merci de votre fidélité, {prenom}",
      body: "Vous cumulez {points} points dans notre programme {nom_restaurant}. Une attention particulière vous attend lors de votre prochaine visite : un dessert offert sur simple présentation de cet email.",
      cta_text: "Voir mes avantages",
      cta_url: null,
      image_url: null,
    },
  },
  {
    id: "reactivation",
    name: "Réactivation",
    description: "Reconquérir un client absent depuis longtemps",
    type: "promotion",
    subject: "Vous nous manquez, {prenom}",
    content: {
      title: "Vous nous manquez, {prenom}",
      body: "Cela fait quelques temps que nous n'avons pas eu le plaisir de vous accueillir. Pour fêter vos retrouvailles avec notre cuisine, nous vous offrons l'apéritif lors de votre prochaine venue.",
      cta_text: "Réserver maintenant",
      cta_url: null,
      image_url: null,
    },
  },
  {
    id: "newsletter",
    name: "Newsletter mensuelle",
    description: "Actualités, nouveautés à la carte",
    type: "newsletter",
    subject: "Les nouvelles de {nom_restaurant}",
    content: {
      title: "Les nouvelles du mois",
      body: "Le marché de saison nous a inspiré une nouvelle carte : girolles, châtaignes, gibier. Nous vous donnons rendez-vous autour de plats généreux, à partager ou à savourer en tête à tête.",
      cta_text: "Découvrir la carte",
      cta_url: null,
      image_url: null,
    },
  },
];
