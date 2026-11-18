import type { LegalDocument } from "./types";

export const legalNotice: LegalDocument = {
  key: "legal",
  status: "draft",
  version: "1.3",
  lastUpdated: "2026-11-18",
  text: {
    fr: {
      title: "Mentions légales",
      shortTitle: "Mentions légales",
      description: "Identification de l'éditeur de mslab.ma, hébergement, propriété intellectuelle et droit marocain applicable.",
      lead: "Cette page identifie l'éditeur et résume l'hébergement, la propriété intellectuelle et le droit applicable.",
      sections: [
        {
          id: "editeur",
          title: "Éditeur du site",
          blocks: [
            {
              type: "dl",
              items: [
                ["Dénomination sociale", "{fact:legalName}"],
                ["Forme juridique", "Société à responsabilité limitée (SARL)"],
                ["Registre du commerce", "{ph:rc}"],
                ["Identifiant commun de l'entreprise (ICE)", "{ph:ice}"],
                ["Siège social / adresse", "{fact:address}"],
                ["Téléphone", "{fact:phone}"],
                ["E-mail", "{fact:email}"],
              ],
            },
          ],
        },
        {
          id: "hebergement",
          title: "Hébergement",
          blocks: [
            { type: "p", text: "Vercel héberge le Site et son application ; Supabase héberge la base de données et les fichiers. Pour les données et transferts, voir la [Politique de confidentialité](route:privacy#transferts)." },
          ],
        },
        {
          id: "propriete-intellectuelle",
          title: "Propriété intellectuelle",
          blocks: [
            { type: "p", text: "Le Site, le nom, le logo MSLAB et les contenus publiés appartiennent à {fact:legalName} et sont protégés par les lois n° 2-00 et 17-97. Toute reproduction non autorisée est interdite, sauf usage permis par la loi. Les fichiers transmis restent la propriété des clients et sont régis par les [Conditions des commandes personnalisées](route:custom-orders#droits)." },
          ],
        },
        {
          id: "droit-applicable",
          title: "Droit applicable",
          blocks: [
            { type: "p", text: "Le Site est soumis au droit marocain, notamment à la loi n° 53-05 relative à l'échange électronique de données juridiques. À défaut de règlement amiable, tout litige relève des juridictions marocaines compétentes[[ : {ph:courts}]]." },
            { type: "note", text: "Ces règles s'appliquent sans préjudice des dispositions protectrices du consommateur prévues par la loi n° 31-08." },
          ],
        },
      ],
    },
    en: {
      title: "Legal Notice",
      shortTitle: "Legal notice",
      description: "Publisher identification for mslab.ma, hosting, intellectual property and applicable Moroccan law.",
      lead: "This notice identifies the publisher and covers hosting, intellectual property and governing law.",
      sections: [
        {
          id: "editeur",
          title: "Website publisher",
          blocks: [
            {
              type: "dl",
              items: [
                ["Company name", "{fact:legalName}"],
                ["Legal form", "Limited liability company (SARL)"],
                ["Trade register (RC)", "{ph:rc}"],
                ["Common company identifier (ICE)", "{ph:ice}"],
                ["Registered office / address", "{fact:address}"],
                ["Telephone", "{fact:phone}"],
                ["Email", "{fact:email}"],
              ],
            },
          ],
        },
        {
          id: "hebergement",
          title: "Hosting",
          blocks: [
            { type: "p", text: "Vercel hosts the Website and its application; Supabase hosts the database and files. For data processing and transfers, see the [Privacy Policy](route:privacy#transferts)." },
          ],
        },
        {
          id: "propriete-intellectuelle",
          title: "Intellectual property",
          blocks: [
            { type: "p", text: "The Website, the MSLAB name, logo and published content belong to {fact:legalName} and are protected by Laws No. 2-00 and 17-97. Unauthorised reproduction is prohibited except as permitted by law. Customer-supplied files remain the customer's property and are covered by the [Custom Orders Policy](route:custom-orders#droits)." },
          ],
        },
        {
          id: "droit-applicable",
          title: "Governing law",
          blocks: [
            { type: "p", text: "The Website is governed by Moroccan law, including Law No. 53-05 on the electronic exchange of legal data. Failing an amicable settlement, any dispute falls within the jurisdiction of the competent Moroccan courts[[: {ph:courts}]]." },
            { type: "note", text: "These rules apply without prejudice to the consumer-protection provisions of Law No. 31-08." },
          ],
        },
      ],
    },
    ar: {
      title: "الإشعار القانوني",
      shortTitle: "الإشعار القانوني",
      description: "تعريف ناشر mslab.ma، والاستضافة، والملكية الفكرية، والقانون المغربي الواجب التطبيق.",
      lead: "يعرّف هذا الإشعار بالناشر ويعرض الاستضافة والملكية الفكرية والقانون الواجب التطبيق.",
      sections: [
        {
          id: "editeur",
          title: "ناشر الموقع",
          blocks: [
            {
              type: "dl",
              items: [
                ["التسمية التجارية", "{fact:legalName}"],
                ["الشكل القانوني", "شركة ذات مسؤولية محدودة (SARL)"],
                ["السجل التجاري", "{ph:rc}"],
                ["المعرف الموحد للمقاولة (ICE)", "{ph:ice}"],
                ["المقر الاجتماعي / العنوان", "{fact:address}"],
                ["الهاتف", "{fact:phone}"],
                ["البريد الإلكتروني", "{fact:email}"],
              ],
            },
          ],
        },
        {
          id: "hebergement",
          title: "الاستضافة",
          blocks: [
            { type: "p", text: "تستضيف Vercel الموقع وتطبيقه، وتستضيف Supabase قاعدة البيانات والملفات. للاطلاع على معالجة المعطيات ونقلها، راجعوا [سياسة الخصوصية](route:privacy#transferts)." },
          ],
        },
        {
          id: "propriete-intellectuelle",
          title: "الملكية الفكرية",
          blocks: [
            { type: "p", text: "الموقع واسم MSLAB وشعارها ومحتواها المنشور ملك لـ {fact:legalName} ومحمية بموجب القانونين رقم 2.00 و17.97. ويُمنع استنساخها دون إذن، باستثناء ما يسمح به القانون. وتبقى الملفات المرسلة ملكاً للزبناء وتخضع لـ [شروط الطلبيات المخصصة](route:custom-orders#droits)." },
          ],
        },
        {
          id: "droit-applicable",
          title: "القانون الواجب التطبيق",
          blocks: [
            { type: "p", text: "يخضع الموقع للقانون المغربي، ولا سيما القانون رقم 53.05 المتعلق بالتبادل الإلكتروني للمعطيات القانونية. وفي غياب تسوية ودية، يُعرض كل نزاع على المحاكم المغربية المختصة[[: {ph:courts}]]." },
            { type: "note", text: "تُطبَّق هذه القواعد دون المساس بالمقتضيات الحمائية للمستهلك المنصوص عليها في القانون رقم 31.08." },
          ],
        },
      ],
    },
  },
};
