import type { LegalDocument } from "./types";

export const returns: LegalDocument = {
  key: "returns",
  status: "draft",
  version: "1.2",
  lastUpdated: "2026-11-18",
  text: {
    fr: {
      title: "Retours et remboursements",
      shortTitle: "Retours et remboursements",
      description: "Droit de rétractation du consommateur (loi n° 31-08), exceptions pour les produits personnalisés, et traitement des défauts.",
      lead: "Rétractation, retours et traitement des défauts.",
      sections: [
        {
          id: "retractation",
          title: "Droit de rétractation du consommateur",
          blocks: [
            { type: "p", text: "Lorsqu'un contrat est conclu à distance, le consommateur dispose, conformément à l'article 36 de la loi n° 31-08, d'un délai de sept jours pour se rétracter, sans motif ni pénalité autres que les frais de retour. Le délai court à compter de la réception du produit ou, pour une prestation, de l'acceptation de l'offre." },
            { type: "p", text: "Pour exercer ce droit, une déclaration claire est adressée à MSLAB[[ par e-mail ({fact:email})]][[ ou par courrier ({fact:address})]], avec la référence de la commande. Les produits sont retournés complets et dans leur état d'origine. Les ventes en présence physique et les achats professionnels n'ouvrent pas ce droit." },
          ],
        },
        {
          id: "exceptions",
          title: "Exceptions",
          blocks: [
            { type: "p", text: "Conformément à l'article 38 de la loi n° 31-08, le droit de rétractation ne s'applique notamment pas aux produits confectionnés selon les spécifications du consommateur ou nettement personnalisés, ni aux prestations dont l'exécution a commencé avec son accord avant la fin du délai." },
            { type: "note", text: "Ces exceptions concernent uniquement le droit de rétractation. Elles n'excluent jamais la prise en charge d'un produit défectueux ou non conforme." },
          ],
        },
        {
          id: "defauts",
          title: "Défauts et erreurs de production",
          blocks: [
            { type: "p", text: "Un produit non conforme au devis ou au bon à tirer, un défaut de fabrication ou un dommage lié à un transport organisé par MSLAB est signalé[[ dans le délai suivant : {ph:claimDeadline}]]. MSLAB procède à la reprise, au remplacement ou au remboursement." },
            { type: "p", text: "Ne constituent pas un défaut les écarts de couleur écran/impression dans les tolérances usuelles, ni les erreurs de contenu figurant sur un bon à tirer validé par le Client. Ce traitement s'applique sans préjudice de la garantie légale (Code des obligations et des contrats et loi n° 31-08)." },
          ],
        },
        {
          id: "remboursement",
          title: "Retour et remboursement",
          blocks: [
            { type: "p", text: "Contactez MSLAB avant tout envoi[[ : {fact:email}]][[, {fact:phone}]]. Les frais de retour sont à la charge de MSLAB en cas de défaut qui lui est imputable, et à la charge du consommateur en cas de rétractation. [[Mode de remboursement : {ph:refundMethod}.]] En cas de rétractation, le remboursement intervient dans le délai de l'article 37 de la loi n° 31-08, hors frais de retour." },
          ],
        },
      ],
    },
    en: {
      title: "Returns and Refunds",
      shortTitle: "Returns and refunds",
      description: "Consumer right of withdrawal (Law No. 31-08), exceptions for personalised products, and how defects are handled.",
      lead: "Withdrawal, returns and remedies for defects.",
      sections: [
        {
          id: "retractation",
          title: "Consumer right of withdrawal",
          blocks: [
            { type: "p", text: "Where a contract is concluded at a distance, the consumer has, under Article 36 of Law No. 31-08, seven days to withdraw, without giving reasons and without any penalty other than return costs. The period runs from receipt of the product or, for a service, from acceptance of the offer." },
            { type: "p", text: "To exercise this right, send a clear statement to MSLAB[[ by email ({fact:email})]][[ or by post ({fact:address})]], quoting the order reference. Products must be returned complete and in their original condition. Sales concluded in person and business purchases do not carry this right." },
          ],
        },
        {
          id: "exceptions",
          title: "Exceptions",
          blocks: [
            { type: "p", text: "Under Article 38 of Law No. 31-08, the right of withdrawal does not apply in particular to products made to the consumer's specifications or clearly personalised, nor to services whose performance began with the consumer's agreement before the end of the period." },
            { type: "note", text: "These exceptions concern the right of withdrawal only. They never exclude remedies for a defective or non-conforming product." },
          ],
        },
        {
          id: "defauts",
          title: "Defects and production errors",
          blocks: [
            { type: "p", text: "A product that does not conform to the quotation or proof, a manufacturing defect or damage during transport arranged by MSLAB must be reported[[ within: {ph:claimDeadline}]]. MSLAB will rework, replace or refund." },
            { type: "p", text: "Screen-to-print colour differences within usual tolerances, and content errors on a proof approved by the Customer, are not defects. This applies without prejudice to the legal warranty (Code of Obligations and Contracts and Law No. 31-08)." },
          ],
        },
        {
          id: "remboursement",
          title: "Return and refund",
          blocks: [
            { type: "p", text: "Contact MSLAB before sending anything back[[: {fact:email}]][[, {fact:phone}]]. Return costs are borne by MSLAB where the defect is attributable to it, and by the consumer in the case of withdrawal. [[Refund method: {ph:refundMethod}.]] In the case of withdrawal, the refund is made within the period in Article 37 of Law No. 31-08, excluding return costs." },
          ],
        },
      ],
    },
    ar: {
      title: "الإرجاع والاسترداد",
      shortTitle: "الإرجاع والاسترداد",
      description: "حق المستهلك في التراجع (القانون رقم 31.08)، واستثناءات المنتجات المخصصة، ومعالجة العيوب.",
      lead: "التراجع والإرجاع ومعالجة العيوب.",
      sections: [
        {
          id: "retractation",
          title: "حق المستهلك في التراجع",
          blocks: [
            { type: "p", text: "عندما يُبرم العقد عن بعد، يتوفر المستهلك، طبقاً للمادة 36 من القانون رقم 31.08، على أجل سبعة أيام للتراجع، دون تبرير ودون غرامة غير مصاريف الإرجاع. ويسري الأجل من تسلم المنتج، أو من قبول العرض بالنسبة للخدمات." },
            { type: "p", text: "لممارسة هذا الحق، يُوجَّه تصريح واضح إلى MSLAB[[ عبر البريد الإلكتروني ({fact:email})]][[ أو بالبريد ({fact:address})]]، مع مرجع الطلبية. وتُرجع المنتجات كاملة وفي حالتها الأصلية. ولا يترتب هذا الحق عن البيوع الحضورية ولا عن مشتريات المهنيين." },
          ],
        },
        {
          id: "exceptions",
          title: "الاستثناءات",
          blocks: [
            { type: "p", text: "طبقاً للمادة 38 من القانون رقم 31.08، لا يُطبَّق حق التراجع على الخصوص على المنتجات المصنوعة وفق مواصفات المستهلك أو المخصصة بشكل واضح، ولا على الخدمات التي بدأ تنفيذها بموافقته قبل انتهاء الأجل." },
            { type: "note", text: "تخص هذه الاستثناءات حق التراجع وحده، ولا تستبعد التكفل بمنتج معيب أو غير مطابق." },
          ],
        },
        {
          id: "defauts",
          title: "العيوب وأخطاء الإنتاج",
          blocks: [
            { type: "p", text: "يُبلَّغ بكل منتج غير مطابق لعرض السعر أو لنموذج الطبع، أو بعيب صنع، أو بضرر ناتج عن نقل نظمته MSLAB[[، داخل الأجل الآتي: {ph:claimDeadline}]]. وتقوم MSLAB بإعادة الإنجاز أو الاستبدال أو الاسترداد." },
            { type: "p", text: "لا تُعدّ عيباً فروق الألوان بين الشاشة والطباعة ضمن الهوامش المعتادة، ولا أخطاء المحتوى الواردة في نموذج طبع صادق عليه الزبون. وتُطبَّق هذه المعالجة دون المساس بالضمان القانوني (ظهير الالتزامات والعقود والقانون رقم 31.08)." },
          ],
        },
        {
          id: "remboursement",
          title: "الإرجاع والاسترداد",
          blocks: [
            { type: "p", text: "اتصلوا بـ MSLAB قبل أي إرسال[[: {fact:email}]][[، {fact:phone}]]. وتتحمل MSLAB مصاريف الإرجاع في حالة عيب يُعزى إليها، ويتحملها المستهلك في حالة التراجع. [[طريقة الاسترداد: {ph:refundMethod}.]] وفي حالة التراجع، يتم الاسترداد داخل أجل المادة 37 من القانون رقم 31.08، دون مصاريف الإرجاع." },
          ],
        },
      ],
    },
  },
};
