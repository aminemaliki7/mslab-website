import type { LegalDocument } from "./types";

export const customOrders: LegalDocument = {
  key: "custom-orders",
  status: "draft",
  version: "1.2",
  lastUpdated: "2026-11-18",
  text: {
    fr: {
      title: "Conditions des commandes personnalisées",
      shortTitle: "Commandes personnalisées",
      description: "Droits sur les fichiers, bon à tirer et exclusion du droit de rétractation pour les produits sur mesure.",
      lead: "Fichiers, validation du bon à tirer et produits personnalisés.",
      sections: [
        {
          id: "droits",
          title: "Fichiers et droits",
          blocks: [
            { type: "p", text: "Le Client reste propriétaire de ses fichiers. Il garantit détenir les droits nécessaires à leur reproduction (marques, œuvres, droit à l'image), au regard des lois n° 17-97 et n° 2-00, et autorise MSLAB à les utiliser uniquement pour le devis et la commande. Ces conditions complètent les [Conditions générales de vente](route:sales)." },
            { type: "p", text: "MSLAB peut refuser un contenu illicite ou portant atteinte aux droits de tiers. Une réalisation n'est présentée dans le portfolio qu'avec l'accord écrit du Client. Conservation des fichiers : voir la [Politique de confidentialité](route:privacy#fichiers)." },
          ],
        },
        {
          id: "bat",
          title: "Bon à tirer",
          blocks: [
            { type: "p", text: "Avant production, MSLAB soumet un bon à tirer. [[Modalités : {ph:proofProcess}.]] La production ne commence qu'après validation expresse du Client. Les éléments validés sont réputés acceptés ; les couleurs d'un BAT numérique restent indicatives." },
          ],
        },
        {
          id: "retractation",
          title: "Personnalisation et rétractation",
          blocks: [
            { type: "p", text: "Les produits nettement personnalisés sont exclus du droit de rétractation (article 38 de la loi n° 31-08). Une production non conforme au BAT validé, du fait de MSLAB, est reprise à ses frais, conformément à la [Politique de retours et remboursements](route:returns#defauts)." },
          ],
        },
      ],
    },
    en: {
      title: "Custom Orders Policy",
      shortTitle: "Custom orders",
      description: "Rights in files, proof approval and exclusion of withdrawal for made-to-measure products.",
      lead: "Files, proof approval and personalised products.",
      sections: [
        {
          id: "droits",
          title: "Files and rights",
          blocks: [
            { type: "p", text: "The Customer remains the owner of their files and warrants that they hold the rights needed to reproduce them (trademarks, works, image rights), under Laws No. 17-97 and No. 2-00. MSLAB may use the files only for the quotation and order. These terms supplement the [Terms of Sale](route:sales)." },
            { type: "p", text: "MSLAB may refuse unlawful content or content that infringes third-party rights. Work is shown in the portfolio only with the Customer's written agreement. File retention: see the [Privacy Policy](route:privacy#fichiers)." },
          ],
        },
        {
          id: "bat",
          title: "Proof approval",
          blocks: [
            { type: "p", text: "Before production, MSLAB submits a proof. [[Arrangements: {ph:proofProcess}.]] Production starts only after the Customer's express approval. Approved elements are deemed accepted; colours on a digital proof remain indicative." },
          ],
        },
        {
          id: "retractation",
          title: "Personalisation and withdrawal",
          blocks: [
            { type: "p", text: "Clearly personalised products are excluded from the right of withdrawal (Article 38 of Law No. 31-08). Production that does not conform to the approved proof because of MSLAB is redone at MSLAB's expense, in accordance with the [Returns and Refunds Policy](route:returns#defauts)." },
          ],
        },
      ],
    },
    ar: {
      title: "شروط الطلبيات المخصصة",
      shortTitle: "الطلبيات المخصصة",
      description: "الحقوق على الملفات، ونموذج الطبع، واستثناء حق التراجع بالنسبة للمنتجات حسب الطلب.",
      lead: "الملفات والمصادقة على نموذج الطبع والمنتجات المخصصة.",
      sections: [
        {
          id: "droits",
          title: "الملفات والحقوق",
          blocks: [
            { type: "p", text: "يظل الزبون مالكاً لملفاته، ويضمن امتلاكه الحقوق اللازمة لاستنساخها (العلامات، والمصنفات، والحق في الصورة) في ضوء القانونين رقم 17.97 ورقم 2.00. ولا يجوز لـ MSLAB استعمالها إلا لإعداد عرض السعر وتنفيذ الطلبية. وتكمّل هذه الشروط [الشروط العامة للبيع](route:sales)." },
            { type: "p", text: "يجوز لـ MSLAB رفض محتوى غير مشروع أو ماس بحقوق الغير. ولا يُعرض أي إنجاز في معرض الأعمال إلا بموافقة كتابية من الزبون. الاحتفاظ بالملفات: انظر [سياسة الخصوصية](route:privacy#fichiers)." },
          ],
        },
        {
          id: "bat",
          title: "نموذج الطبع",
          blocks: [
            { type: "p", text: "قبل الإنتاج، تعرض MSLAB نموذج طبع. [[الكيفيات: {ph:proofProcess}.]] ولا يبدأ الإنتاج إلا بعد مصادقة الزبون الصريحة. وتُعدّ العناصر المصادق عليها مقبولة؛ وتبقى ألوان النموذج الرقمي إرشادية." },
          ],
        },
        {
          id: "retractation",
          title: "التخصيص وحق التراجع",
          blocks: [
            { type: "p", text: "المنتجات المخصصة بشكل واضح مستثناة من حق التراجع (المادة 38 من القانون رقم 31.08). ويُعاد على نفقة MSLAB كل إنتاج غير مطابق لنموذج الطبع المصادق عليه بسبب يعود إليها، وفقاً لـ [سياسة الإرجاع والاسترداد](route:returns#defauts)." },
          ],
        },
      ],
    },
  },
};
