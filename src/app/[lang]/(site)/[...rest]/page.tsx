import { notFound } from "next/navigation";

/** Unknown paths under a valid locale render the localized not-found page (with site chrome). */
export default function CatchAll() {
  notFound();
}
