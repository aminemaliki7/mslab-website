import type { LegalDocument } from "./types";

export const terms: LegalDocument = {
  key: "terms",
  status: "draft",
  version: "1.2",
  lastUpdated: "2026-11-18",
  text: {
    fr: {
      title: "Conditions générales d'utilisation",
      shortTitle: "Conditions d'utilisation",
      description: "Règles d'accès au site mslab.ma et d'utilisation de ses formulaires.",
      lead: "Règles d’utilisation du site et de ses formulaires.",
      sections: [
        {
          id: "objet",
          title: "Objet et acceptation",
          blocks: [
            { type: "p", text: "L'utilisation de mslab.ma implique l'acceptation des présentes conditions. Le Site est accessible sans création de compte. Les ventes sont régies par les [Conditions générales de vente](route:sales). L'espace d'administration est réservé au personnel de MSLAB." },
          ],
        },
        {
          id: "informations",
          title: "Informations et formulaires",
          blocks: [
            { type: "p", text: "Les produits et réalisations présentés ne constituent pas une offre ferme. Les prix, quantités et délais sont confirmés au devis. Les aperçus de personnalisation sont des simulations et ne valent pas bon à tirer." },
            { type: "p", text: "L'utilisateur s'engage à fournir des informations exactes, à ne pas usurper l'identité d'autrui, à ne pas transmettre de fichiers malveillants et à n'utiliser les formulaires que conformément à leur objet." },
          ],
        },
        {
          id: "contenus",
          title: "Contenus transmis",
          blocks: [
            { type: "p", text: "L'utilisateur garantit détenir les droits sur les fichiers qu'il transmet. Leur traitement est décrit dans les [Conditions des commandes personnalisées](route:custom-orders#droits). Les éléments du Site sont protégés comme indiqué dans les [Mentions légales](route:legal#propriete-intellectuelle)." },
          ],
        },
        {
          id: "droit",
          title: "Droit applicable",
          blocks: [
            { type: "p", text: "Les présentes conditions sont soumises au droit marocain, dans les conditions précisées dans les [Mentions légales](route:legal#droit-applicable). Les données personnelles sont traitées conformément à la [Politique de confidentialité](route:privacy)." },
          ],
        },
      ],
    },
    en: {
      title: "Terms of Use",
      shortTitle: "Terms of use",
      description: "Rules for accessing mslab.ma and using its forms.",
      lead: "Rules for using the Website and its forms.",
      sections: [
        {
          id: "objet",
          title: "Purpose and acceptance",
          blocks: [
            { type: "p", text: "Using mslab.ma implies acceptance of these terms. The Website is accessible without creating an account. Sales are governed by the [Terms of Sale](route:sales). The administration area is reserved for MSLAB staff." },
          ],
        },
        {
          id: "informations",
          title: "Information and forms",
          blocks: [
            { type: "p", text: "Products and past work shown do not constitute a firm offer. Prices, quantities and lead times are confirmed in the quotation. Customisation previews are simulations and are not a proof." },
            { type: "p", text: "The user undertakes to provide accurate information, not to impersonate others, not to send malicious files and to use the forms only for their intended purpose." },
          ],
        },
        {
          id: "contenus",
          title: "Content you send",
          blocks: [
            { type: "p", text: "The user warrants that they hold the rights to the files they send. How those files are handled is described in the [Custom Orders Policy](route:custom-orders#droits). Website content is protected as set out in the [Legal Notice](route:legal#propriete-intellectuelle)." },
          ],
        },
        {
          id: "droit",
          title: "Governing law",
          blocks: [
            { type: "p", text: "These terms are governed by Moroccan law, as specified in the [Legal Notice](route:legal#droit-applicable). Personal data is processed in accordance with the [Privacy Policy](route:privacy)." },
          ],
        },
      ],
    },
    ar: {
      title: "الشروط العامة للاستعمال",
      shortTitle: "شروط الاستعمال",
      description: "قواعد الولوج إلى موقع mslab.ma واستعمال استماراته.",
      lead: "قواعد استعمال الموقع واستماراته.",
      sections: [
        {
          id: "objet",
          title: "الموضوع والقبول",
          blocks: [
            { type: "p", text: "يعني استعمال mslab.ma قبول هذه الشروط. والولوج إلى الموقع لا يتطلب إنشاء حساب. وتنظم البيوع [الشروط العامة للبيع](route:sales). وفضاء الإدارة مخصص لمستخدمي MSLAB." },
          ],
        },
        {
          id: "informations",
          title: "المعلومات والاستمارات",
          blocks: [
            { type: "p", text: "المنتجات والإنجازات المعروضة لا تشكل عرضاً ملزماً. وتُؤكَّد الأثمنة والكميات والآجال في عرض السعر. ومعاينات التخصيص محاكاة ولا تقوم مقام نموذج الطبع." },
            { type: "p", text: "يلتزم المستعمل بتقديم معلومات صحيحة، وبعدم انتحال هوية الغير، وبعدم إرسال ملفات خبيثة، وباستعمال الاستمارات وفق الغرض المخصص لها فقط." },
          ],
        },
        {
          id: "contenus",
          title: "المحتويات المرسلة",
          blocks: [
            { type: "p", text: "يضمن المستعمل أنه يملك الحقوق على الملفات التي يرسلها. وتُبيَّن معالجتها في [شروط الطلبيات المخصصة](route:custom-orders#droits). وعناصر الموقع محمية وفق ما هو مبين في [الإشعار القانوني](route:legal#propriete-intellectuelle)." },
          ],
        },
        {
          id: "droit",
          title: "القانون الواجب التطبيق",
          blocks: [
            { type: "p", text: "تخضع هذه الشروط للقانون المغربي وفق ما هو مبين في [الإشعار القانوني](route:legal#droit-applicable). وتُعالج المعطيات الشخصية وفقاً لـ [سياسة الخصوصية](route:privacy)." },
          ],
        },
      ],
    },
  },
};
