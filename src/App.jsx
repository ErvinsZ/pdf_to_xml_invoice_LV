import I18nProvider from "./i18n/I18nProvider";
import InvoiceReview from "./InvoiceReview";

export default function App() {
  return (
    <I18nProvider>
      <InvoiceReview />
    </I18nProvider>
  );
}
