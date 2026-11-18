import { legalDocumentPage } from "@/components/legal/legal-document-page";

const page = legalDocumentPage("terms");

export const generateMetadata = page.generateMetadata;
export default page.Page;
