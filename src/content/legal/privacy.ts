import type { LegalDocument } from "./types";

export const privacy: LegalDocument = {
  key: "privacy",
  status: "draft",
  version: "1.3",
  lastUpdated: "2026-11-18",
  text: {
    fr: {
      title: "Politique de confidentialité",
      shortTitle: "Confidentialité",
      description: "Traitement des données personnelles collectées via mslab.ma, au regard de la loi n° 09-08.",
      lead: "Données utilisées, finalités, conservation et droits.",
      sections: [
        {
          id: "responsable",
          title: "Responsable du traitement",
          blocks: [
            { type: "p", text: "Le responsable du traitement est {fact:legalName}[[, dont le siège social est à {fact:address}]]. [[Contact : {fact:email}.]]" },
            { type: "p", text: "Les données personnelles sont traitées conformément à la loi n° 09-08 et à son décret n° 2-09-165." },
          ],
        },
        {
          id: "cndp",
          title: "Formalités auprès de la CNDP",
          blocks: [
            { type: "p", text: "Les traitements décrits ci-dessous relèvent des formalités préalables auprès de la Commission nationale de contrôle de la protection des données à caractère personnel (CNDP). [[Référence : {ph:cndpReference}.]]" },
          ],
        },
        {
          id: "donnees",
          title: "Données collectées",
          blocks: [
            {
              type: "table",
              head: ["Origine", "Données", "Caractère"],
              rows: [
                ["Formulaire de contact", "Nom, e-mail, téléphone, objet, message", "Téléphone facultatif"],
                ["Demande de devis", "Coordonnées, entreprise, produits, quantités, spécifications", "Entreprise facultative"],
                ["Production personnalisée", "Coordonnées, description du projet, fichiers joints", "Fichiers facultatifs"],
                ["Suivi de commande", "Référence et e-mail", "Obligatoires pour la consultation"],
              ],
            },
            { type: "p", text: "Les cookies et traceurs sont décrits dans la [Politique relative aux cookies](route:cookies)." },
          ],
        },
        {
          id: "finalites",
          title: "Finalités",
          blocks: [
            {
              type: "ul",
              items: [
                "répondre à vos messages et établir un devis, sur la base de votre consentement et des mesures précontractuelles que vous demandez ;",
                "exécuter et suivre votre commande ;",
                "respecter les obligations comptables et fiscales ;",
                "mesurer l'audience du Site, uniquement si vous l'acceptez.",
              ],
            },
            { type: "p", text: "Vos données ne sont ni vendues ni utilisées pour de la prospection sans votre accord." },
          ],
        },
        {
          id: "fichiers",
          title: "Fichiers transmis",
          blocks: [
            { type: "p", text: "Les fichiers joints (logos, visuels, documents) sont stockés de manière privée et utilisés uniquement pour étudier votre demande et réaliser la commande. Ils ne sont pas réutilisés sans votre accord écrit. [[Durée de conservation : {ph:retentionFiles}.]] Vous pouvez en demander la suppression[[ à {fact:email}]]." },
          ],
        },
        {
          id: "destinataires",
          title: "Destinataires",
          blocks: [
            { type: "p", text: "Vos données sont destinées au personnel habilité de MSLAB et, selon les instructions de MSLAB, aux prestataires suivants : Vercel Inc. (hébergement), Supabase Inc. (base de données et fichiers),[[ {ph:emailProvider} (e-mails),]] Google (mesure d'audience, uniquement si vous l'acceptez)[[ et {ph:carriers} (livraison, données d'acheminement uniquement)]]." },
          ],
        },
        {
          id: "transferts",
          title: "Transferts hors du Maroc",
          blocks: [
            { type: "p", text: "L'hébergement et certains prestataires sont situés hors du Maroc (notamment en France et aux États-Unis). Ces transferts sont soumis aux articles 43 et 44 de la loi n° 09-08 et, le cas échéant, à l'autorisation de la CNDP. [[Référence : {ph:cndpReference}.]]" },
          ],
        },
        {
          id: "conservation",
          title: "Durées de conservation",
          blocks: [
            {
              type: "table",
              head: ["Données", "Durée"],
              rows: [
                ["Messages de contact", "{ph:retentionInquiries}"],
                ["Demandes de devis sans suite", "{ph:retentionQuotes}"],
                ["Fichiers transmis", "{ph:retentionFiles}"],
                ["Données clients et facturation", "{ph:retentionCustomers}, et au minimum la durée légale comptable et fiscale"],
              ],
            },
          ],
        },
        {
          id: "droits",
          title: "Vos droits",
          blocks: [
            { type: "p", text: "Conformément aux articles 7, 8 et 9 de la loi n° 09-08, vous disposez d'un droit d'accès, de rectification et d'opposition pour motifs légitimes, ainsi que d'un droit d'opposition à la prospection. Vous pouvez retirer votre consentement à tout moment." },
            { type: "p", text: "Pour exercer ces droits, contactez MSLAB[[ : {fact:email}]][[ ou {fact:address}]]. Vous pouvez également saisir la CNDP : [www.cndp.ma](https://www.cndp.ma)." },
          ],
        },
      ],
    },
    en: {
      title: "Privacy Policy",
      shortTitle: "Privacy",
      description: "Processing of personal data collected through mslab.ma, under Law No. 09-08.",
      lead: "Data used, purposes, retention and your rights.",
      sections: [
        {
          id: "responsable",
          title: "Data controller",
          blocks: [
            { type: "p", text: "The data controller is {fact:legalName}[[, whose registered office is at {fact:address}]]. [[Contact: {fact:email}.]]" },
            { type: "p", text: "Personal data is processed under Law No. 09-08 and Decree No. 2-09-165." },
          ],
        },
        {
          id: "cndp",
          title: "CNDP formalities",
          blocks: [
            { type: "p", text: "The processing described below is subject to prior formalities with the National Commission for the Control of Personal Data Protection (CNDP). [[Reference: {ph:cndpReference}.]]" },
          ],
        },
        {
          id: "donnees",
          title: "Data we collect",
          blocks: [
            {
              type: "table",
              head: ["Source", "Data", "Status"],
              rows: [
                ["Contact form", "Name, email, telephone, subject, message", "Telephone optional"],
                ["Quotation request", "Contact details, company, products, quantities, specifications", "Company optional"],
                ["Custom production", "Contact details, project description, attached files", "Files optional"],
                ["Order tracking", "Reference and email", "Required to look up an order"],
              ],
            },
            { type: "p", text: "Cookies and similar technologies are described in the [Cookie Policy](route:cookies)." },
          ],
        },
        {
          id: "finalites",
          title: "Purposes",
          blocks: [
            {
              type: "ul",
              items: [
                "replying to your messages and preparing a quotation, on the basis of your consent and the pre-contractual steps you request;",
                "performing and tracking your order;",
                "meeting accounting and tax obligations;",
                "measuring Website audience, only if you accept it.",
              ],
            },
            { type: "p", text: "Your data is never sold and is not used for marketing without your agreement." },
          ],
        },
        {
          id: "fichiers",
          title: "Files you send",
          blocks: [
            { type: "p", text: "Attached files (logos, artwork, documents) are stored privately and used only to review your request and carry out the order. They are not reused without your written agreement. [[Retention period: {ph:retentionFiles}.]] You may ask for them to be deleted[[ at {fact:email}]]." },
          ],
        },
        {
          id: "destinataires",
          title: "Recipients",
          blocks: [
            { type: "p", text: "Your data is intended for authorised MSLAB staff and, under MSLAB's instructions, the following providers: Vercel Inc. (hosting), Supabase Inc. (database and files),[[ {ph:emailProvider} (email),]] Google (audience measurement, only if you accept it)[[ and {ph:carriers} (delivery, shipping data only)]]." },
          ],
        },
        {
          id: "transferts",
          title: "Transfers outside Morocco",
          blocks: [
            { type: "p", text: "Hosting and some providers are located outside Morocco (in particular in France and the United States). These transfers are subject to Articles 43 and 44 of Law No. 09-08 and, where applicable, to CNDP authorisation. [[Reference: {ph:cndpReference}.]]" },
          ],
        },
        {
          id: "conservation",
          title: "Retention periods",
          blocks: [
            {
              type: "table",
              head: ["Data", "Period"],
              rows: [
                ["Contact messages", "{ph:retentionInquiries}"],
                ["Quotation requests not followed by an order", "{ph:retentionQuotes}"],
                ["Files you send", "{ph:retentionFiles}"],
                ["Customer and invoicing data", "{ph:retentionCustomers}, and at least the period required by accounting and tax law"],
              ],
            },
          ],
        },
        {
          id: "droits",
          title: "Your rights",
          blocks: [
            { type: "p", text: "Under Articles 7, 8 and 9 of Law No. 09-08, you have the right to access your data, to have it rectified and to object on legitimate grounds, as well as the right to object to marketing. You may withdraw your consent at any time." },
            { type: "p", text: "To exercise these rights, contact MSLAB[[: {fact:email}]][[ or {fact:address}]]. You may also contact the CNDP: [www.cndp.ma](https://www.cndp.ma)." },
          ],
        },
      ],
    },
    ar: {
      title: "سياسة الخصوصية",
      shortTitle: "الخصوصية",
      description: "معالجة المعطيات الشخصية المجمعة عبر mslab.ma، في ضوء القانون رقم 09.08.",
      lead: "المعطيات المستعملة وغاياتها ومدة الاحتفاظ بها وحقوقكم.",
      sections: [
        {
          id: "responsable",
          title: "المسؤول عن المعالجة",
          blocks: [
            { type: "p", text: "المسؤول عن المعالجة هو {fact:legalName}[[، ومقره الاجتماعي في {fact:address}]]. [[الاتصال: {fact:email}.]]" },
            { type: "p", text: "تُعالج المعطيات الشخصية وفقاً للقانون رقم 09.08 ومرسومه رقم 2.09.165." },
          ],
        },
        {
          id: "cndp",
          title: "الإجراءات لدى اللجنة الوطنية (CNDP)",
          blocks: [
            { type: "p", text: "تخضع المعالجات المبينة أدناه للإجراءات المسبقة لدى اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي (CNDP). [[المرجع: {ph:cndpReference}.]]" },
          ],
        },
        {
          id: "donnees",
          title: "المعطيات المجمعة",
          blocks: [
            {
              type: "table",
              head: ["المصدر", "المعطيات", "الطابع"],
              rows: [
                ["استمارة الاتصال", "الاسم، البريد الإلكتروني، الهاتف، الموضوع، الرسالة", "الهاتف اختياري"],
                ["طلب عرض سعر", "معطيات الاتصال، المقاولة، المنتجات، الكميات، المواصفات", "المقاولة اختيارية"],
                ["الإنتاج المخصص", "معطيات الاتصال، وصف المشروع، الملفات المرفقة", "الملفات اختيارية"],
                ["تتبع الطلبية", "المرجع والبريد الإلكتروني", "إلزامية للاطلاع"],
              ],
            },
            { type: "p", text: "تُبيَّن ملفات تعريف الارتباط وأدوات التتبع في [سياسة ملفات تعريف الارتباط](route:cookies)." },
          ],
        },
        {
          id: "finalites",
          title: "الغايات",
          blocks: [
            {
              type: "ul",
              items: [
                "الرد على رسائلكم وإعداد عرض سعر، بناءً على موافقتكم والإجراءات السابقة للتعاقد التي تطلبونها؛",
                "تنفيذ طلبيتكم وتتبعها؛",
                "الوفاء بالالتزامات المحاسبية والضريبية؛",
                "قياس نسبة زيارة الموقع، فقط إذا وافقتم على ذلك.",
              ],
            },
            { type: "p", text: "لا تُباع معطياتكم ولا تُستعمل للاستقطاب التجاري دون موافقتكم." },
          ],
        },
        {
          id: "fichiers",
          title: "الملفات المرسلة",
          blocks: [
            { type: "p", text: "تُحفظ الملفات المرفقة (شعارات، تصاميم، وثائق) بشكل خاص وتُستعمل فقط لدراسة طلبكم وإنجاز الطلبية. ولا يُعاد استعمالها دون موافقتكم الكتابية. [[مدة الاحتفاظ: {ph:retentionFiles}.]] ويمكنكم طلب حذفها[[ عبر {fact:email}]]." },
          ],
        },
        {
          id: "destinataires",
          title: "المرسَل إليهم",
          blocks: [
            { type: "p", text: "معطياتكم موجهة للمستخدمين المؤهلين لدى MSLAB، ووفق تعليماتها، لمقدمي الخدمات الآتي ذكرهم: Vercel Inc. (الاستضافة)، وSupabase Inc. (قاعدة البيانات والملفات)[[، و{ph:emailProvider} (البريد الإلكتروني)]]، وGoogle (قياس الزيارة، فقط إذا وافقتم)[[، و{ph:carriers} (التوصيل، معطيات النقل فقط)]]." },
          ],
        },
        {
          id: "transferts",
          title: "النقل خارج المغرب",
          blocks: [
            { type: "p", text: "تقع الاستضافة وبعض مقدمي الخدمات خارج المغرب (ولا سيما في فرنسا والولايات المتحدة). وتخضع عمليات النقل هذه للمادتين 43 و44 من القانون رقم 09.08، وعند الاقتضاء لإذن اللجنة الوطنية. [[المرجع: {ph:cndpReference}.]]" },
          ],
        },
        {
          id: "conservation",
          title: "مدد الاحتفاظ",
          blocks: [
            {
              type: "table",
              head: ["المعطيات", "المدة"],
              rows: [
                ["رسائل الاتصال", "{ph:retentionInquiries}"],
                ["طلبات عروض الأسعار التي لم تُتبع بطلبية", "{ph:retentionQuotes}"],
                ["الملفات المرسلة", "{ph:retentionFiles}"],
                ["معطيات الزبناء والفوترة", "{ph:retentionCustomers}، وعلى الأقل المدة القانونية المحاسبية والضريبية"],
              ],
            },
          ],
        },
        {
          id: "droits",
          title: "حقوقكم",
          blocks: [
            { type: "p", text: "طبقاً للمواد 7 و8 و9 من القانون رقم 09.08، تتمتعون بحق الولوج والتصحيح والتعرض لأسباب مشروعة، وكذا حق التعرض على الاستقطاب التجاري. ويمكنكم سحب موافقتكم في أي وقت." },
            { type: "p", text: "لممارسة هذه الحقوق، اتصلوا بـ MSLAB[[: {fact:email}]][[ أو {fact:address}]]. ويمكنكم أيضاً اللجوء إلى اللجنة الوطنية: [www.cndp.ma](https://www.cndp.ma)." },
          ],
        },
      ],
    },
  },
};
