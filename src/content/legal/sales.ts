import type { LegalDocument } from "./types";

export const sales: LegalDocument = {
  key: "sales",
  status: "draft",
  version: "1.2",
  lastUpdated: "2026-11-18",
  text: {
    fr: {
      title: "Conditions générales de vente",
      shortTitle: "Conditions de vente",
      description: "Formation de la commande, prix, paiement, délais, garanties et droit de rétractation au regard du droit marocain.",
      lead: "Conditions applicables aux ventes conclues sur devis.",
      sections: [
        {
          id: "champ",
          title: "Champ d'application",
          blocks: [
            { type: "p", text: "Les présentes CGV s'appliquent aux ventes réalisées par {fact:legalName}. Elles sont complétées par la [Politique de livraison](route:delivery), la [Politique de retours et remboursements](route:returns) et, pour les produits personnalisés, les [Conditions des commandes personnalisées](route:custom-orders)." },
            { type: "p", text: "Est consommateur, au sens de la loi n° 31-08, toute personne qui acquiert un produit ou un service pour un usage non professionnel. Les dispositions de cette loi bénéficient aux seuls consommateurs." },
            { type: "note", text: "Aucune stipulation ne peut priver le consommateur des droits que lui reconnaît la loi n° 31-08." },
          ],
        },
        {
          id: "commande",
          title: "Devis et commande",
          blocks: [
            { type: "p", text: "Une demande n'engage pas les parties. MSLAB adresse un devis (produits, quantités, prix, taxes, frais de livraison, délai, paiement)[[, valable {ph:quoteValidity}]]. La commande est formée par l'acceptation écrite du devis. Pour les produits personnalisés, la production commence après validation du bon à tirer." },
            { type: "p", text: "Conformément à la loi n° 53-05, l'acceptation électronique a valeur de preuve dans les conditions prévues par la loi." },
          ],
        },
        {
          id: "prix",
          title: "Prix et paiement",
          blocks: [
            { type: "p", text: "Les prix sont ceux du devis, en dirhams marocains, hors taxes ou toutes taxes comprises. Pour le consommateur, le prix total TTC, frais de livraison inclus, est indiqué avant l'acceptation." },
            { type: "p", text: "Aucun paiement en ligne n'est proposé sur le Site. [[Moyens de paiement : {ph:paymentMethods}.]] [[Modalités : {ph:paymentTerms}.]]" },
          ],
        },
        {
          id: "delais",
          title: "Délais et livraison",
          blocks: [
            { type: "p", text: "Le délai de réalisation[[ ({ph:productionLeadTimes})]] court après acceptation du devis, réception de fichiers exploitables, validation du bon à tirer le cas échéant et encaissement de l'acompte s'il est prévu. Les modalités de remise figurent dans la [Politique de livraison](route:delivery)." },
            { type: "p", text: "Pour le consommateur, le délai de livraison est précisé avant la conclusion du contrat. En cas de dépassement, il dispose des droits prévus par la loi n° 31-08." },
          ],
        },
        {
          id: "conformite",
          title: "Conformité et garanties",
          blocks: [
            { type: "p", text: "Toute non-conformité ou défaut apparent est signalé à MSLAB[[ dans le délai suivant : {ph:claimDeadline}]]. Les produits bénéficient de la garantie légale des défauts de la chose vendue (Dahir formant Code des obligations et des contrats, articles 549 et suivants, et, pour les consommateurs, loi n° 31-08)." },
            { type: "p", text: "En cas d'erreur de production imputable à MSLAB : reprise, remplacement ou remboursement, selon la [Politique de retours et remboursements](route:returns#defauts)." },
          ],
        },
        {
          id: "retractation",
          title: "Droit de rétractation",
          blocks: [
            { type: "p", text: "Le consommateur qui conclut un contrat à distance dispose du droit de rétractation de la loi n° 31-08, sous réserve des exceptions, notamment pour les produits nettement personnalisés. Voir la [Politique de retours et remboursements](route:returns#retractation)." },
          ],
        },
        {
          id: "litiges",
          title: "Droit applicable et litiges",
          blocks: [
            { type: "p", text: "Les CGV sont soumises au droit marocain. [[En cas de difficulté : {fact:email}.]] À défaut d'accord amiable, les juridictions marocaines compétentes sont saisies. Pour le consommateur, les règles de compétence de la loi n° 31-08 s'appliquent. [[Pour le client professionnel : {ph:courts}.]]" },
          ],
        },
      ],
    },
    en: {
      title: "Terms of Sale",
      shortTitle: "Terms of sale",
      description: "Order formation, prices, payment, lead times, warranties and withdrawal under Moroccan law.",
      lead: "Terms for sales made by quotation.",
      sections: [
        {
          id: "champ",
          title: "Scope",
          blocks: [
            { type: "p", text: "These Terms of Sale apply to sales by {fact:legalName}. They are supplemented by the [Delivery Policy](route:delivery), the [Returns and Refunds Policy](route:returns) and, for personalised products, the [Custom Orders Policy](route:custom-orders)." },
            { type: "p", text: "Under Law No. 31-08, a consumer is any person who acquires a product or service for non-professional use. That law benefits consumers only." },
            { type: "note", text: "Nothing in these terms may deprive a consumer of the rights granted by Law No. 31-08." },
          ],
        },
        {
          id: "commande",
          title: "Quotation and order",
          blocks: [
            { type: "p", text: "A request is not binding. MSLAB sends a quotation (products, quantities, price, taxes, delivery charges, lead time, payment)[[, valid for {ph:quoteValidity}]]. The order is formed when the quotation is accepted in writing. For personalised products, production starts after proof approval." },
            { type: "p", text: "Under Law No. 53-05, electronic acceptance has evidential value on the conditions laid down by law." },
          ],
        },
        {
          id: "prix",
          title: "Prices and payment",
          blocks: [
            { type: "p", text: "Prices are those in the quotation, in Moroccan dirhams, excluding or including taxes. For consumers, the total price including all taxes and delivery charges is stated before acceptance." },
            { type: "p", text: "No online payment is available on the Website. [[Payment methods: {ph:paymentMethods}.]] [[Terms: {ph:paymentTerms}.]]" },
          ],
        },
        {
          id: "delais",
          title: "Lead times and delivery",
          blocks: [
            { type: "p", text: "The production lead time[[ ({ph:productionLeadTimes})]] runs after acceptance of the quotation, receipt of usable files, proof approval where applicable and receipt of any deposit. Handover is described in the [Delivery Policy](route:delivery)." },
            { type: "p", text: "For consumers, the delivery period is specified before the contract is concluded. If it is exceeded, the consumer has the rights provided for by Law No. 31-08." },
          ],
        },
        {
          id: "conformite",
          title: "Conformity and warranties",
          blocks: [
            { type: "p", text: "Any non-conformity or visible defect must be reported to MSLAB[[ within: {ph:claimDeadline}]]. Products are covered by the legal warranty against defects (Code of Obligations and Contracts, Articles 549 et seq., and, for consumers, Law No. 31-08)." },
            { type: "p", text: "In the event of a production error attributable to MSLAB: rework, replacement or refund, as set out in the [Returns and Refunds Policy](route:returns#defauts)." },
          ],
        },
        {
          id: "retractation",
          title: "Right of withdrawal",
          blocks: [
            { type: "p", text: "A consumer who concludes a distance contract has the right of withdrawal under Law No. 31-08, subject to the exceptions, in particular for clearly personalised products. See the [Returns and Refunds Policy](route:returns#retractation)." },
          ],
        },
        {
          id: "litiges",
          title: "Governing law and disputes",
          blocks: [
            { type: "p", text: "These Terms of Sale are governed by Moroccan law. [[In the event of a problem: {fact:email}.]] Failing an amicable settlement, the competent Moroccan courts have jurisdiction. For consumers, the jurisdiction rules of Law No. 31-08 apply. [[For business customers: {ph:courts}.]]" },
          ],
        },
      ],
    },
    ar: {
      title: "الشروط العامة للبيع",
      shortTitle: "شروط البيع",
      description: "إبرام الطلبية، والأثمنة، والأداء، والآجال، والضمانات، وحق التراجع في ضوء القانون المغربي.",
      lead: "شروط البيع بناءً على عرض السعر.",
      sections: [
        {
          id: "champ",
          title: "مجال التطبيق",
          blocks: [
            { type: "p", text: "تُطبَّق هذه الشروط على البيوع التي تنجزها {fact:legalName}. وتُكمّلها [سياسة التوصيل](route:delivery) و[سياسة الإرجاع والاسترداد](route:returns)، وبالنسبة للمنتجات المخصصة [شروط الطلبيات المخصصة](route:custom-orders)." },
            { type: "p", text: "يُعدّ مستهلكاً، في مفهوم القانون رقم 31.08، كل شخص يقتني منتجاً أو خدمة لغرض غير مهني. ولا يستفيد من مقتضيات هذا القانون إلا المستهلكون." },
            { type: "note", text: "لا يجوز لأي بند أن يحرم المستهلك من الحقوق التي يخولها له القانون رقم 31.08." },
          ],
        },
        {
          id: "commande",
          title: "عرض السعر والطلبية",
          blocks: [
            { type: "p", text: "لا يُلزم الطلب الطرفين. وتوجه MSLAB عرض سعر (المنتجات، والكميات، والثمن، والرسوم، ومصاريف التوصيل، والأجل، والأداء)[[، صالح لمدة {ph:quoteValidity}]]. وتنعقد الطلبية بالقبول الكتابي لعرض السعر. وبالنسبة للمنتجات المخصصة، يبدأ الإنتاج بعد المصادقة على نموذج الطبع." },
            { type: "p", text: "طبقاً للقانون رقم 53.05، يكتسي القبول الإلكتروني حجية الإثبات وفق الشروط القانونية." },
          ],
        },
        {
          id: "prix",
          title: "الأثمنة والأداء",
          blocks: [
            { type: "p", text: "الأثمنة هي الواردة في عرض السعر، بالدرهم المغربي، دون احتساب الرسوم أو شاملة لجميع الرسوم. وبالنسبة للمستهلك، يُبيَّن الثمن الإجمالي شاملاً لجميع الرسوم ومصاريف التوصيل قبل القبول." },
            { type: "p", text: "لا يتيح الموقع أي أداء عبر الإنترنت. [[وسائل الأداء: {ph:paymentMethods}.]] [[الكيفيات: {ph:paymentTerms}.]]" },
          ],
        },
        {
          id: "delais",
          title: "الآجال والتوصيل",
          blocks: [
            { type: "p", text: "يسري أجل الإنجاز[[ ({ph:productionLeadTimes})]] بعد قبول عرض السعر، والتوصل بملفات قابلة للاستعمال، والمصادقة على نموذج الطبع عند الاقتضاء، وتحصيل التسبيق إن وُجد. وتُبيَّن كيفيات التسليم في [سياسة التوصيل](route:delivery)." },
            { type: "p", text: "بالنسبة للمستهلك، يُحدَّد أجل التسليم قبل إبرام العقد. وفي حالة تجاوزه، يتمتع بالحقوق المنصوص عليها في القانون رقم 31.08." },
          ],
        },
        {
          id: "conformite",
          title: "المطابقة والضمانات",
          blocks: [
            { type: "p", text: "تُبلَّغ MSLAB بكل عدم مطابقة أو عيب ظاهر[[ داخل الأجل الآتي: {ph:claimDeadline}]]. وتستفيد المنتجات من الضمان القانوني لعيوب الشيء المبيع (ظهير الالتزامات والعقود، الفصول 549 وما يليها، وبالنسبة للمستهلكين القانون رقم 31.08)." },
            { type: "p", text: "في حالة خطأ إنتاج يُعزى إلى MSLAB: إعادة الإنجاز أو الاستبدال أو الاسترداد، وفق [سياسة الإرجاع والاسترداد](route:returns#defauts)." },
          ],
        },
        {
          id: "retractation",
          title: "حق التراجع",
          blocks: [
            { type: "p", text: "يتمتع المستهلك الذي يبرم عقداً عن بعد بحق التراجع المنصوص عليه في القانون رقم 31.08، مع مراعاة الاستثناءات، ولا سيما المنتجات المخصصة بشكل واضح. انظر [سياسة الإرجاع والاسترداد](route:returns#retractation)." },
          ],
        },
        {
          id: "litiges",
          title: "القانون الواجب التطبيق والنزاعات",
          blocks: [
            { type: "p", text: "تخضع هذه الشروط للقانون المغربي. [[وفي حالة صعوبة: {fact:email}.]] وفي غياب اتفاق ودي، تُعرض النزاعات على المحاكم المغربية المختصة. وبالنسبة للمستهلك، تُطبَّق قواعد الاختصاص في القانون رقم 31.08. [[وبالنسبة للزبون المهني: {ph:courts}.]]" },
          ],
        },
      ],
    },
  },
};
