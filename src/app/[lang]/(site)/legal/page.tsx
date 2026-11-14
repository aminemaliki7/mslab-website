import { legalPage } from "@/components/layout/legal-page";

// Text managed in /admin/settings (validated by MSLAB); never written by developers.
const page = legalPage("legal");

export const generateMetadata = page.generateMetadata;
export default page.Page;
