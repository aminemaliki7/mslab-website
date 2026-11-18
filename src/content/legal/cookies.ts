import type { LegalDocument } from "./types";

/**
 * Inventory taken from the code (2026-11-18): src/proxy.ts (NEXT_LOCALE),
 * components/consent (mslab_consent), components/quote/quote-list-store.ts (localStorage),
 * app/[lang]/layout.tsx + components/print-on-demand/proof-text.ts (sessionStorage),
 * GTM-NZGP5ZDF (consent-gated). Admin-only cookies are omitted from this public inventory.
 * Update this document whenever a visitor-facing storage key or tag is added.
 */
export const cookies: LegalDocument = {
  key: "cookies",
  status: "draft",
  version: "1.1",
  lastUpdated: "2026-11-18",
  text: {
    fr: {
      title: "Politique relative aux cookies",
      shortTitle: "Cookies",
      description: "Traceurs utilisés sur mslab.ma et gestion de votre consentement à la mesure d'audience.",
      lead: "Le Site utilise des traceurs indispensables à son fonctionnement. La mesure d'audience n'est activée qu'avec votre accord, conformément à la loi n° 09-08 lorsque des données sont transmises hors du Maroc.",
      sections: [
        {
          id: "essentiels",
          title: "Traceurs essentiels",
          blocks: [
            { type: "p", text: "Ces traceurs sont nécessaires au fonctionnement du Site ou à un service que vous demandez. Ils ne nécessitent pas votre consentement." },
            {
              type: "table",
              head: ["Nom", "Type", "Finalité", "Durée"],
              rows: [
                ["NEXT_LOCALE", "Cookie", "Mémoriser la langue choisie", "12 mois"],
                ["mslab_consent", "Cookie", "Enregistrer vos choix en matière de cookies", "6 mois"],
                ["mslab.quote.v1", "localStorage", "Conserver la liste de devis que vous composez", "Jusqu'à l'envoi ou la suppression"],
                ["mslab-proof-text", "sessionStorage", "Conserver le texte saisi dans l'outil de personnalisation", "Session"],
              ],
            },
          ],
        },
        {
          id: "mesure-audience",
          title: "Mesure d'audience",
          blocks: [
            { type: "p", text: "Avec votre accord, le Site charge Google Tag Manager afin de déclencher Google Analytics. Des cookies tels que « _ga » (jusqu'à 2 ans) peuvent alors être déposés. Les données sont traitées par Google, y compris hors du Maroc ; voir la [Politique de confidentialité](route:privacy#transferts)." },
            { type: "note", text: "Sans votre accord, Google Tag Manager n'est pas chargé." },
          ],
        },
        {
          id: "consentement",
          title: "Votre consentement",
          blocks: [
            { type: "p", text: "Un bandeau vous permet d'accepter ou de refuser la mesure d'audience. Refuser n'empêche pas d'utiliser le Site. Votre choix est conservé 6 mois. Vous pouvez le modifier à tout moment." },
            { type: "p", text: "[Gérer mes préférences](consent:open)" },
          ],
        },
      ],
    },
    en: {
      title: "Cookie Policy",
      shortTitle: "Cookies",
      description: "Trackers used on mslab.ma and how to manage consent for audience measurement.",
      lead: "The Website uses trackers that are essential for it to work. Audience measurement is enabled only with your agreement, in line with Law No. 09-08 where data is transferred outside Morocco.",
      sections: [
        {
          id: "essentiels",
          title: "Essential trackers",
          blocks: [
            { type: "p", text: "These trackers are needed for the Website to work or for a service you request. They do not require your consent." },
            {
              type: "table",
              head: ["Name", "Type", "Purpose", "Duration"],
              rows: [
                ["NEXT_LOCALE", "Cookie", "Remember your chosen language", "12 months"],
                ["mslab_consent", "Cookie", "Record your cookie choices", "6 months"],
                ["mslab.quote.v1", "localStorage", "Keep the quotation list you are building", "Until sent or cleared"],
                ["mslab-proof-text", "sessionStorage", "Keep the text typed in the customisation tool", "Session"],
              ],
            },
          ],
        },
        {
          id: "mesure-audience",
          title: "Audience measurement",
          blocks: [
            { type: "p", text: "With your agreement, the Website loads Google Tag Manager to trigger Google Analytics. Cookies such as \"_ga\" (up to 2 years) may then be set. The data is processed by Google, including outside Morocco; see the [Privacy Policy](route:privacy#transferts)." },
            { type: "note", text: "Without your agreement, Google Tag Manager is not loaded." },
          ],
        },
        {
          id: "consentement",
          title: "Your consent",
          blocks: [
            { type: "p", text: "A banner lets you accept or reject audience measurement. Rejecting does not prevent you from using the Website. Your choice is kept for 6 months. You can change it at any time." },
            { type: "p", text: "[Manage my preferences](consent:open)" },
          ],
        },
      ],
    },
    ar: {
      title: "سياسة ملفات تعريف الارتباط",
      shortTitle: "ملفات تعريف الارتباط",
      description: "أدوات التتبع المستعملة في mslab.ma وتدبير موافقتكم على قياس نسبة الزيارة.",
      lead: "يستعمل الموقع أدوات تتبع ضرورية لاشتغاله. ولا يُفعَّل قياس نسبة الزيارة إلا بموافقتكم، طبقاً للقانون رقم 09.08 عندما تُنقل المعطيات خارج المغرب.",
      sections: [
        {
          id: "essentiels",
          title: "أدوات التتبع الأساسية",
          blocks: [
            { type: "p", text: "هذه الأدوات ضرورية لاشتغال الموقع أو لخدمة تطلبونها. ولا تستلزم موافقتكم." },
            {
              type: "table",
              head: ["الاسم", "النوع", "الغاية", "المدة"],
              rows: [
                ["NEXT_LOCALE", "ملف تعريف ارتباط", "حفظ اللغة المختارة", "12 شهراً"],
                ["mslab_consent", "ملف تعريف ارتباط", "حفظ اختياراتكم بشأن ملفات تعريف الارتباط", "6 أشهر"],
                ["mslab.quote.v1", "localStorage", "الاحتفاظ بقائمة عرض السعر التي تُعدّونها", "إلى حين الإرسال أو الحذف"],
                ["mslab-proof-text", "sessionStorage", "الاحتفاظ بالنص المُدخل في أداة التخصيص", "الجلسة"],
              ],
            },
          ],
        },
        {
          id: "mesure-audience",
          title: "قياس نسبة الزيارة",
          blocks: [
            { type: "p", text: "بموافقتكم، يُحمّل الموقع أداة Google Tag Manager لتشغيل Google Analytics. وقد تُوضع حينها ملفات مثل «_ga» (حتى سنتين). وتعالج Google المعطيات، بما في ذلك خارج المغرب؛ انظر [سياسة الخصوصية](route:privacy#transferts)." },
            { type: "note", text: "دون موافقتكم، لا تُحمَّل أداة Google Tag Manager." },
          ],
        },
        {
          id: "consentement",
          title: "موافقتكم",
          blocks: [
            { type: "p", text: "يتيح لكم شريط إعلامي قبول قياس نسبة الزيارة أو رفضه. ولا يمنع الرفض استعمال الموقع. ويُحتفظ باختياركم 6 أشهر. ويمكنكم تعديله في أي وقت." },
            { type: "p", text: "[تدبير تفضيلاتي](consent:open)" },
          ],
        },
      ],
    },
  },
};
