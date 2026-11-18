import type { LegalDocument } from "./types";

export const delivery: LegalDocument = {
  key: "delivery",
  status: "draft",
  version: "1.2",
  lastUpdated: "2026-11-18",
  text: {
    fr: {
      title: "Politique de livraison",
      shortTitle: "Livraison",
      description: "Zones, délais, frais et réception des commandes MSLAB, informations prévues par la loi n° 31-08.",
      lead: "Zones, délais, frais et modalités de livraison.",
      sections: [
        {
          id: "modalites",
          title: "Remise, zones et frais",
          blocks: [
            { type: "p", text: "La commande est livrée à l'adresse indiquée et/ou retirée[[ selon les modalités suivantes : {ph:pickup}]]." },
            { type: "p", text: "[[Zones : {ph:deliveryZones}.]] [[Frais : {ph:deliveryFees}.]] [[Transporteurs : {ph:carriers}.]]" },
          ],
        },
        {
          id: "delais",
          title: "Délais",
          blocks: [
            { type: "p", text: "Le délai d'acheminement s'ajoute au délai de réalisation. [[Délais indicatifs : {ph:deliveryLeadTimes}.]]" },
            { type: "p", text: "Pour le consommateur, la date ou le délai de livraison est communiqué avant la conclusion du contrat ; en cas de dépassement, il dispose des droits prévus par la loi n° 31-08." },
          ],
        },
        {
          id: "reception",
          title: "Réception",
          blocks: [
            { type: "p", text: "À la réception, le Client vérifie l'état des colis. Un défaut apparent ou un dommage lié au transport organisé par MSLAB est signalé[[ dans le délai suivant : {ph:claimDeadline}]], et traité selon la [Politique de retours et remboursements](route:returns#defauts)." },
          ],
        },
      ],
    },
    en: {
      title: "Delivery Policy",
      shortTitle: "Delivery",
      description: "Areas, lead times, charges and receipt of MSLAB orders, as required by Law No. 31-08.",
      lead: "Delivery areas, timing, charges and arrangements.",
      sections: [
        {
          id: "modalites",
          title: "Handover, areas and charges",
          blocks: [
            { type: "p", text: "The order is delivered to the address given and/or collected[[ as follows: {ph:pickup}]]." },
            { type: "p", text: "[[Areas: {ph:deliveryZones}.]] [[Charges: {ph:deliveryFees}.]] [[Carriers: {ph:carriers}.]]" },
          ],
        },
        {
          id: "delais",
          title: "Lead times",
          blocks: [
            { type: "p", text: "Shipping time is added to the production lead time. [[Indicative times: {ph:deliveryLeadTimes}.]]" },
            { type: "p", text: "For consumers, the delivery date or period is communicated before the contract is concluded; if it is exceeded, the consumer has the rights provided for by Law No. 31-08." },
          ],
        },
        {
          id: "reception",
          title: "Receipt",
          blocks: [
            { type: "p", text: "On receipt, the Customer checks the parcels. A visible defect or damage during transport arranged by MSLAB must be reported[[ within: {ph:claimDeadline}]], and is handled under the [Returns and Refunds Policy](route:returns#defauts)." },
          ],
        },
      ],
    },
    ar: {
      title: "سياسة التوصيل",
      shortTitle: "التوصيل",
      description: "المناطق والآجال والمصاريف وتسلم طلبيات MSLAB، وفق المعلومات المطلوبة بموجب القانون رقم 31.08.",
      lead: "مناطق التوصيل وآجاله ومصاريفه وكيفياته.",
      sections: [
        {
          id: "modalites",
          title: "التسليم والمناطق والمصاريف",
          blocks: [
            { type: "p", text: "تُسلَّم الطلبية إلى العنوان المحدد و/أو تُسحب[[ وفق الكيفيات الآتية: {ph:pickup}]]." },
            { type: "p", text: "[[المناطق: {ph:deliveryZones}.]] [[المصاريف: {ph:deliveryFees}.]] [[الناقلون: {ph:carriers}.]]" },
          ],
        },
        {
          id: "delais",
          title: "الآجال",
          blocks: [
            { type: "p", text: "يُضاف أجل النقل إلى أجل الإنجاز. [[الآجال التقديرية: {ph:deliveryLeadTimes}.]]" },
            { type: "p", text: "بالنسبة للمستهلك، يُبلَّغ تاريخ التسليم أو أجله قبل إبرام العقد؛ وفي حالة تجاوزه، يتمتع بالحقوق المنصوص عليها في القانون رقم 31.08." },
          ],
        },
        {
          id: "reception",
          title: "التسلم",
          blocks: [
            { type: "p", text: "عند التسلم، يتحقق الزبون من حالة الطرود. ويُبلَّغ بكل عيب ظاهر أو ضرر ناتج عن نقل نظمته MSLAB[[ داخل الأجل الآتي: {ph:claimDeadline}]]، ويُعالَج وفق [سياسة الإرجاع والاسترداد](route:returns#defauts)." },
          ],
        },
      ],
    },
  },
};
