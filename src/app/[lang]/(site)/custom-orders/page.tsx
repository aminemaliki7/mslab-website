import { legalDocumentPage } from "@/components/legal/legal-document-page";

const page = legalDocumentPage("custom-orders");

export const generateMetadata = page.generateMetadata;
export default page.Page;
