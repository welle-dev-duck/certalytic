import { createTranslator, type Translator } from "@/lib/i18n/translate";
import { getLocale } from "@/lib/i18n/cookies";
import {
  getNamespaceMessages,
  type MessageNamespace,
} from "@/lib/i18n/messages";

export async function getTranslations(
  namespace: MessageNamespace,
): Promise<Translator> {
  const locale = await getLocale();
  return createTranslator(getNamespaceMessages(locale, namespace));
}

export { getLocale };
